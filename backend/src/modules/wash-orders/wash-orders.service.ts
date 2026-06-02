import { supabase } from '../../db/supabase';
import {
  ValidationError,
  NotFoundError,
  ServiceUnavailableError,
} from '../../middleware/errors';
import { WashOrder, WashOrderResponse, WashOrderStatus } from './wash-orders.types';
import { WashServicePricesService } from '../wash-service-prices/wash-service-prices.service';

export interface WashDashboardMetrics {
  totalOrders: number;
  completedToday: number;
  inProgress: number;
  waiting: number;
  revenueToday: number;
  recentCompleted: Array<{
    id: string;
    licensePlate: string;
    serviceName: string;
    price: number;
    completedAt: string;
  }>;
}

export class WashOrderService {
  private washServicePricesService = new WashServicePricesService();

  /**
   * Get dashboard metrics for wash orders (today)
   */
  async getDashboardMetrics(): Promise<WashDashboardMetrics> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Get all orders created today
      const { data: todayOrders, error: todayError } = await supabase
        .from('wash_orders')
        .select('id, status, license_plate, wash_service_id, completed_at, created_at')
        .gte('created_at', todayISO);

      if (todayError) {
        throw new ServiceUnavailableError('Serviço temporariamente indisponível');
      }

      const orders = todayOrders || [];
      const completedToday = orders.filter(o => o.status === 'Completed');
      const inProgress = orders.filter(o => o.status === 'InProgress');
      const waiting = orders.filter(o => o.status === 'Waiting');

      // Get service prices for revenue calculation
      const serviceIds = [...new Set(completedToday.map(o => o.wash_service_id))];
      let servicesMap: Record<string, { name: string; price: number }> = {};

      if (serviceIds.length > 0) {
        const { data: services } = await supabase
          .from('wash_services')
          .select('id, name, price')
          .in('id', serviceIds);

        for (const s of services || []) {
          servicesMap[s.id] = { name: s.name, price: s.price };
        }
      }

      const revenueToday = completedToday.reduce((sum, o) => {
        const service = servicesMap[o.wash_service_id];
        return sum + (service?.price || 0);
      }, 0);

      // Recent completed (last 5)
      const recentCompleted = completedToday
        .sort((a, b) => new Date(b.completed_at || '').getTime() - new Date(a.completed_at || '').getTime())
        .slice(0, 5)
        .map(o => ({
          id: o.id,
          licensePlate: o.license_plate,
          serviceName: servicesMap[o.wash_service_id]?.name || 'Serviço',
          price: servicesMap[o.wash_service_id]?.price || 0,
          completedAt: o.completed_at || o.created_at,
        }));

      return {
        totalOrders: orders.length,
        completedToday: completedToday.length,
        inProgress: inProgress.length,
        waiting: waiting.length,
        revenueToday: parseFloat(revenueToday.toFixed(2)),
        recentCompleted,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableError) throw error;
      throw new ServiceUnavailableError('Serviço temporariamente indisponível');
    }
  }

  /**
   * Creates a new wash order for a vehicle
   * @param licensePlate - Vehicle license plate (validated format)
   * @param washServiceId - UUID of the wash service
   * @param vehicleTypeId - Optional UUID of the vehicle type (from frontend)
   * @returns Promise<WashOrderResponse> - Created order with service details
   * @throws ValidationError if service not found or inactive
   * @throws ServiceUnavailableError if database error occurs
   */
  async createOrder(
    licensePlate: string,
    washServiceId: string,
    vehicleTypeId?: string
  ): Promise<WashOrderResponse> {
    // Query wash_services table for the service
    const { data: service, error: serviceError } = await supabase
      .from('wash_services')
      .select('*')
      .eq('id', washServiceId)
      .single();

    if (serviceError || !service) {
      throw new ValidationError('Serviço de lavagem não encontrado');
    }

    if (!service.is_active) {
      throw new ValidationError('Serviço de lavagem não está disponível');
    }

    try {
      // Use vehicleTypeId from request, or try to get from parking_records
      let resolvedVehicleTypeId: string | null = vehicleTypeId || null;

      if (!resolvedVehicleTypeId) {
        const { data: parkingRecord } = await supabase
          .from('parking_records')
          .select('vehicle_type_id')
          .eq('license_plate', licensePlate)
          .eq('status', 'Parked')
          .single();

        if (parkingRecord?.vehicle_type_id) {
          resolvedVehicleTypeId = parkingRecord.vehicle_type_id;
        }
      }

      // Resolve price for the vehicle type × wash service combination
      // This will throw ValidationError (422) if no price is configured
      const { price: resolvedPrice } = await this.washServicePricesService.resolvePrice(
        resolvedVehicleTypeId,
        washServiceId
      );

      // Insert new WashOrder with resolved price
      const { data: order, error: insertError } = await supabase
        .from('wash_orders')
        .insert({
          license_plate: licensePlate,
          wash_service_id: washServiceId,
          vehicle_type_id: resolvedVehicleTypeId,
          price: resolvedPrice,
          status: 'Waiting',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError || !order) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      // Fetch vehicle type details for response
      let vehicleType = null;
      if (resolvedVehicleTypeId) {
        const { data: vt } = await supabase
          .from('vehicle_types')
          .select('id, name, code')
          .eq('id', resolvedVehicleTypeId)
          .single();
        vehicleType = vt;
      }

      // Return formatted response
      return this.formatWashOrderResponse(order, service, vehicleType);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ServiceUnavailableError) {
        throw error;
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }
  }

  /**
   * Advances the status of a wash order
   * @param id - UUID of the wash order
   * @param newStatus - New status (InProgress or Completed)
   * @param paymentMethod - Optional payment method (used when completing an order)
   * @returns Promise<WashOrderResponse> - Updated order
   * @throws NotFoundError if order not found
   * @throws ValidationError if transition is invalid
   * @throws ServiceUnavailableError if database error occurs
   */
  async advanceStatus(
    id: string,
    newStatus: WashOrderStatus,
    paymentMethod?: string
  ): Promise<WashOrderResponse> {
    // Query for the order
    const { data: order, error: queryError } = await supabase
      .from('wash_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (queryError || !order) {
      throw new NotFoundError('Ordem de lavagem não encontrada');
    }

    const currentStatus = order.status as WashOrderStatus;

    // Validate transition
    const validTransitions: Record<WashOrderStatus, WashOrderStatus[]> = {
      Waiting: ['InProgress'],
      InProgress: ['Completed'],
      Completed: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new ValidationError(
        `Transição inválida: ${currentStatus} → ${newStatus}. Permitido: Waiting→InProgress→Completed`
      );
    }

    try {
      // Prepare update data
      const updateData: Record<string, any> = {
        status: newStatus,
      };

      if (newStatus === 'InProgress') {
        updateData.started_at = new Date().toISOString();
      } else if (newStatus === 'Completed') {
        updateData.completed_at = new Date().toISOString();
        if (paymentMethod) {
          updateData.payment_method = paymentMethod;
        }
      }

      // Update the order
      const { data: updatedOrder, error: updateError } = await supabase
        .from('wash_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError || !updatedOrder) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      // Fetch the service details for the response
      const { data: service, error: serviceError } = await supabase
        .from('wash_services')
        .select('*')
        .eq('id', updatedOrder.wash_service_id)
        .single();

      if (serviceError || !service) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      // Fetch vehicle type if available (no rates needed — wash uses fixed price)
      let vehicleType = null;
      if (updatedOrder.vehicle_type_id) {
        const { data: vt } = await supabase
          .from('vehicle_types')
          .select('id, name, code')
          .eq('id', updatedOrder.vehicle_type_id)
          .single();
        vehicleType = vt;
      }

      return this.formatWashOrderResponse(updatedOrder, service, vehicleType);
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof ServiceUnavailableError
      ) {
        throw error;
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }
  }

  /**
   * Lists wash orders, optionally filtered by status and/or date
   * @param status - Optional status filter (Waiting, InProgress, or Completed)
   * @param date - Optional date filter in YYYY-MM-DD format (filters by created_at day)
   *              Defaults to today for Completed orders if not specified
   * @param showAll - If true, returns all records regardless of date (for history)
   * @returns Promise<WashOrderResponse[]> - Array of orders with service details
   * @throws ValidationError if status is invalid
   * @throws ServiceUnavailableError if database error occurs
   */
  async listOrders(status?: string, date?: string, showAll?: boolean): Promise<WashOrderResponse[]> {
    // Validate status if provided
    if (status) {
      const validStatuses = ['Waiting', 'InProgress', 'Completed'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError(
          'Status inválido. Valores aceitos: Waiting, InProgress, Completed'
        );
      }
    }

    try {
      // Build query - start with from and select
      let query: any = supabase
        .from('wash_orders')
        .select(
          `
          *,
          wash_services:wash_service_id (id, name, price),
          vehicle_types:vehicle_type_id (id, name, code)
        `
        );

      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }

      // Apply date filter for active queue view (not history)
      // Completed orders: show only today (reset at midnight)
      // Waiting/InProgress: always show all (they're active)
      if (!showAll && !date) {
        const today = new Date().toISOString().split('T')[0];
        const dayStart = `${today}T00:00:00.000Z`;

        if (status === 'Completed') {
          // Explicit Completed filter: show only today
          query = query.gte('completed_at', dayStart);
        } else if (!status) {
          // No status filter (all): exclude old completed, keep all Waiting/InProgress
          // Use OR logic: status != Completed OR completed_at >= today
          query = query.or(`status.neq.Completed,completed_at.gte.${dayStart}`);
        }
        // If status is Waiting or InProgress, no date filter needed
      } else if (date) {
        // Specific date filter
        const dayStart = `${date}T00:00:00.000Z`;
        const dayEnd = `${date}T23:59:59.999Z`;
        query = query.gte('created_at', dayStart).lte('created_at', dayEnd);
      }

      // Apply ordering
      query = query.order('created_at', { ascending: true });

      const { data: orders, error } = await query;

      if (error) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      // Format and return responses
      return (orders || []).map((order: any) =>
        this.formatWashOrderResponseFromJoin(order)
      );
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ServiceUnavailableError) {
        throw error;
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }
  }

  /**
   * Lists completed wash orders history (all dates)
   * Returns last 50 completed orders ordered by completed_at DESC
   * Used for the history/audit view
   */
  async listHistory(limit: number = 20, offset: number = 0): Promise<WashOrderResponse[]> {
    try {
      const { data: orders, error } = await supabase
        .from('wash_orders')
        .select(
          `
          *,
          wash_services:wash_service_id (id, name, price),
          vehicle_types:vehicle_type_id (id, name, code)
        `
        )
        .eq('status', 'Completed')
        .order('completed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      return (orders || []).map((order: any) =>
        this.formatWashOrderResponseFromJoin(order)
      );
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        throw error;
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }
  }

  /**
   * Formats a WashOrder and WashService into WashOrderResponse
   * @private
   */
  private formatWashOrderResponse(
    order: WashOrder,
    service: any,
    vehicleType?: any
  ): WashOrderResponse {
    const response: WashOrderResponse = {
      id: order.id,
      licensePlate: order.license_plate,
      washService: {
        id: service.id,
        name: service.name,
        price: service.price,
      },
      price: order.price,
      status: order.status,
      createdAt: order.created_at,
      startedAt: order.started_at,
      completedAt: order.completed_at,
    };

    if (order.payment_method) {
      response.paymentMethod = order.payment_method;
    }

    if (vehicleType) {
      response.vehicleType = {
        id: vehicleType.id,
        name: vehicleType.name,
        code: vehicleType.code,
      };
    }

    return response;
  }

  /**
   * Formats a WashOrder with joined WashService data into WashOrderResponse
   * @private
   */
  private formatWashOrderResponseFromJoin(order: any): WashOrderResponse {
    const service = Array.isArray(order.wash_services)
      ? order.wash_services[0]
      : order.wash_services;

    const response: WashOrderResponse = {
      id: order.id,
      licensePlate: order.license_plate,
      washService: {
        id: service.id,
        name: service.name,
        price: service.price,
      },
      price: order.price,
      status: order.status,
      createdAt: order.created_at,
      startedAt: order.started_at,
      completedAt: order.completed_at,
    };

    if (order.payment_method) {
      response.paymentMethod = order.payment_method;
    }

    // Add vehicle type if available
    if (order.vehicle_types) {
      const vehicleType = Array.isArray(order.vehicle_types)
        ? order.vehicle_types[0]
        : order.vehicle_types;
      response.vehicleType = {
        id: vehicleType.id,
        name: vehicleType.name,
        code: vehicleType.code,
      };
    }

    return response;
  }
}
