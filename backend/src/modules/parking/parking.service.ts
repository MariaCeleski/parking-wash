/**
 * Service layer for parking operations
 * Handles check-in, check-out, fee calculation, and record listing
 */

import { supabase } from '../../db/supabase';
import { config } from '../../config/env';
import {
  ParkingRecord,
  CheckInResponse,
  CheckOutResponse,
  CheckInRequest,
  CheckOutRequest,
} from './parking.types';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  PaymentRequiredError,
  ServiceUnavailableError,
} from '../../middleware/errors';
import { PricingService } from './services/pricing.service';
import { PaymentService } from './services/payment.service';
import { VehicleTypeService } from '../vehicle-types/vehicle-type.service';

export class ParkingService {
  private vehicleTypeService = new VehicleTypeService();
  private paymentService = new PaymentService();

  /**
   * Register a vehicle entry into the parking lot
   * @param request - CheckInRequest with licensePlate and optional vehicleTypeId
   * @returns CheckInResponse with parking record details
   * @throws ConflictError if vehicle is already parked
   * @throws ValidationError if vehicleTypeId is invalid
   * @throws ServiceUnavailableError if database operation fails
   */
  async checkIn(request: CheckInRequest | string): Promise<CheckInResponse> {
    try {
      // Handle backward compatibility: if string is passed, treat as licensePlate
      const licensePlate = typeof request === 'string' ? request : request.licensePlate;
      const vehicleTypeId = typeof request === 'string' ? undefined : request.vehicleTypeId;

      // Check if vehicle is already parked
      const { data: existingRecord, error: selectError } = await supabase
        .from('parking_records')
        .select('*')
        .eq('license_plate', licensePlate)
        .eq('status', 'Parked')
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 = no rows found (expected case)
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      if (existingRecord) {
        throw new ConflictError(
          `Veículo com placa ${licensePlate} já está estacionado`
        );
      }

      // Validate vehicleTypeId if provided
      if (vehicleTypeId) {
        try {
          await this.vehicleTypeService.getById(vehicleTypeId);
        } catch (error) {
          if (error instanceof NotFoundError) {
            throw new ValidationError('Tipo de veículo não encontrado');
          }
          throw error;
        }
      }

      // Insert new parking record
      const now = new Date().toISOString();
      const { data: newRecord, error: insertError } = await supabase
        .from('parking_records')
        .insert({
          license_plate: licensePlate,
          entry_time: now,
          status: 'Parked',
          vehicle_type_id: vehicleTypeId || null,
        })
        .select()
        .single();

      if (insertError) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      return {
        id: newRecord.id,
        licensePlate: newRecord.license_plate,
        entryTime: newRecord.entry_time,
        status: newRecord.status,
      };
    } catch (error) {
      if (
        error instanceof ConflictError ||
        error instanceof ValidationError ||
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
   * Register a vehicle exit from the parking lot and calculate parking fee
   * @param id - Parking record ID
   * @param request - Optional CheckOutRequest with tariff options
   * @returns CheckOutResponse with parking details and calculated fee
   * @throws NotFoundError if parking record not found
   * @throws ValidationError if vehicle already checked out
   * @throws PaymentRequiredError if payment processing fails
   * @throws ServiceUnavailableError if database operation fails
   */
  async checkOut(id: string, request?: CheckOutRequest): Promise<CheckOutResponse> {
    try {
      // Query for the parking record
      const { data: record, error: selectError } = await supabase
        .from('parking_records')
        .select('*')
        .eq('id', id)
        .single();

      if (selectError) {
        if (selectError.code === 'PGRST116') {
          throw new NotFoundError('Registro de estacionamento não encontrado');
        }
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      // Check if already exited
      if (record.status !== 'Parked') {
        throw new ValidationError('Este veículo já realizou checkout');
      }

      // Calculate exit time and duration
      const exitTime = new Date();
      const entryTime = new Date(record.entry_time);
      const durationMs = exitTime.getTime() - entryTime.getTime();
      const durationMinutes = Math.max(1, Math.floor(durationMs / 60000));

      // Calculate fee using progressive pricing rules
      // Rules: 1ª hora R$10, frações de 30min R$5, diária R$60 (cap automático)
      let totalAmount: number;
      let appliedDailyRate = false;

      if (record.vehicle_type_id) {
        // Use vehicle type pricing if available
        try {
          const vehicleType = await this.vehicleTypeService.getById(record.vehicle_type_id);
          const breakdown = PricingService.calculateFee(
            entryTime,
            exitTime,
            vehicleType.hourlyRate,
            vehicleType.dailyRate
          );
          totalAmount = breakdown.totalAmount;
          appliedDailyRate = breakdown.dailyCharge > 0;
        } catch (error) {
          // Fallback to config rates if vehicle type not found
          const breakdown = PricingService.calculateFee(
            entryTime,
            exitTime,
            config.hourlyRate,
            config.dailyRateCap
          );
          totalAmount = breakdown.totalAmount;
          appliedDailyRate = breakdown.dailyCharge > 0;
        }
      } else {
        // Use config rates (no vehicle type)
        const breakdown = PricingService.calculateFee(
          entryTime,
          exitTime,
          config.hourlyRate,
          config.dailyRateCap
        );
        totalAmount = breakdown.totalAmount;
        appliedDailyRate = breakdown.dailyCharge > 0;
      }

      totalAmount = parseFloat(totalAmount.toFixed(2));

      // Process payment if paymentMethodId is provided
      if (request?.paymentMethodId) {
        const vehicleTypeName = record.vehicle_type_id
          ? (await this.vehicleTypeService.getById(record.vehicle_type_id).catch(() => null))?.name || 'unknown'
          : 'unknown';

        const paymentResponse = await this.paymentService.processPayment({
          amount: totalAmount,
          currency: 'BRL',
          description: record.license_plate,
          metadata: {
            parkingId: id,
            vehicleType: vehicleTypeName,
          },
        });

        if (paymentResponse.status === 'failed') {
          // Payment failed — do NOT update status to "Exited"
          throw new PaymentRequiredError(
            paymentResponse.message || 'Falha no processamento do pagamento'
          );
        }

        // Payment succeeded — update record with payment info and status = "Exited"
        const { data: updatedRecord, error: updateError } = await supabase
          .from('parking_records')
          .update({
            status: 'Exited',
            exit_time: exitTime.toISOString(),
            duration_minutes: durationMinutes,
            total_amount: totalAmount,
            applied_daily_rate: appliedDailyRate,
            payment_status: 'Completed',
            payment_method_id: request.paymentMethodId,
            payment_transaction_id: paymentResponse.transactionId,
          })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          throw new ServiceUnavailableError(
            'Serviço temporariamente indisponível. Tente novamente em instantes'
          );
        }

        return {
          id: updatedRecord.id,
          licensePlate: updatedRecord.license_plate,
          entryTime: updatedRecord.entry_time,
          exitTime: updatedRecord.exit_time,
          durationMinutes: updatedRecord.duration_minutes,
          totalAmount: updatedRecord.total_amount,
          status: updatedRecord.status,
          appliedDailyRate: updatedRecord.applied_daily_rate,
          paymentStatus: updatedRecord.payment_status,
          
        };
      }

      // No paymentMethodId — update record without payment processing (legacy flow)
      const { data: updatedRecord, error: updateError } = await supabase
        .from('parking_records')
        .update({
          status: 'Exited',
          exit_time: exitTime.toISOString(),
          duration_minutes: durationMinutes,
          total_amount: totalAmount,
          applied_daily_rate: appliedDailyRate,
          payment_status: 'Pending',
          payment_method_id: null,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      return {
        id: updatedRecord.id,
        licensePlate: updatedRecord.license_plate,
        entryTime: updatedRecord.entry_time,
        exitTime: updatedRecord.exit_time,
        durationMinutes: updatedRecord.duration_minutes,
        totalAmount: updatedRecord.total_amount,
        status: updatedRecord.status,
        appliedDailyRate: updatedRecord.applied_daily_rate,
        paymentStatus: updatedRecord.payment_status,
        
      };
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ValidationError ||
        error instanceof PaymentRequiredError ||
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
   * Get dashboard metrics for today
   * @returns Revenue, vehicles count, avg duration, current occupancy
   */
  async getDashboardMetrics() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Get today's completed checkouts (revenue + count + avg duration)
      const { data: todayExited, error: exitedError } = await supabase
        .from('parking_records')
        .select('total_amount, duration_minutes, exit_time')
        .eq('status', 'Exited')
        .gte('exit_time', todayISO);

      if (exitedError) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      // Get currently parked vehicles
      const { data: parked, error: parkedError } = await supabase
        .from('parking_records')
        .select('id')
        .eq('status', 'Parked');

      if (parkedError) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      // Get today's check-ins
      const { data: todayEntries, error: entriesError } = await supabase
        .from('parking_records')
        .select('id')
        .gte('entry_time', todayISO);

      if (entriesError) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      const records = todayExited || [];
      const revenueToday = records.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0);
      const checkoutsToday = records.length;
      const avgDuration = records.length > 0
        ? Math.round(records.reduce((sum: number, r: any) => sum + (r.duration_minutes || 0), 0) / records.length)
        : 0;

      // Get recent checkouts (last 5)
      const { data: recentExited } = await supabase
        .from('parking_records')
        .select('id, license_plate, total_amount, duration_minutes, exit_time, vehicle_type_id')
        .eq('status', 'Exited')
        .gte('exit_time', todayISO)
        .order('exit_time', { ascending: false })
        .limit(5);

      const recentCheckouts = (recentExited || []).map((r: any) => ({
        id: r.id,
        licensePlate: r.license_plate,
        totalAmount: r.total_amount || 0,
        durationMinutes: r.duration_minutes || 0,
        exitTime: r.exit_time,
      }));

      return {
        revenueToday: Number(revenueToday.toFixed(2)),
        checkoutsToday,
        entriesTotal: (todayEntries || []).length,
        currentOccupancy: (parked || []).length,
        avgDurationMinutes: avgDuration,
        recentCheckouts,
      };
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
   * Get parking history with pagination
   * @param limit - Number of records to return (default 20)
   * @param offset - Number of records to skip (default 0)
   * @returns Array of parking records with status = 'Exited'
   * @throws ServiceUnavailableError if database operation fails
   */
  async getHistory(limit: number = 20, offset: number = 0): Promise<ParkingRecord[]> {
    try {
      const { data: records, error } = await supabase
        .from('parking_records')
        .select('*')
        .eq('status', 'Exited')
        .order('exit_time', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      // Transform snake_case to camelCase
      return (records || []).map(record => ({
        id: record.id,
        licensePlate: record.license_plate,
        entryTime: record.entry_time,
        exitTime: record.exit_time,
        durationMinutes: record.duration_minutes,
        totalAmount: record.total_amount,
        status: record.status,
        vehicleTypeId: record.vehicle_type_id,
        appliedDailyRate: record.applied_daily_rate,
        paymentStatus: record.payment_status,
        paymentMethodId: record.payment_method_id,
        paymentTransactionId: record.payment_transaction_id,
      })) as ParkingRecord[];
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
   * Calculate parking fee for a given duration
   * Pure function with no I/O operations
   * @param durationMinutes - Duration of parking in minutes
   * @returns Calculated fee in Brazilian Real
   */
  calculateFee(durationMinutes: number): number {
    const hours = Math.ceil(durationMinutes / 60);
    const fee = hours * config.hourlyRate;
    return Math.min(fee, config.dailyRateCap);
  }

  /**
   * List parking records with optional status filter
   * @param status - Optional filter by status ('Parked' or 'Exited')
   * @returns Array of parking records ordered by entry_time DESC, limited to 1000
   * @throws ValidationError if status parameter is invalid
   * @throws ServiceUnavailableError if database operation fails
   */
  async listRecords(status?: string): Promise<ParkingRecord[]> {
    try {
      // Validate status parameter if provided
      if (status && !['Parked', 'Exited'].includes(status)) {
        throw new ValidationError(
          'Status inválido. Valores aceitos: Parked, Exited'
        );
      }

      let query = supabase
        .from('parking_records')
        .select('*')
        .order('entry_time', { ascending: false })
        .limit(1000);

      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }

      const { data: records, error } = await query;

      if (error) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      // Transform snake_case to camelCase
      return (records || []).map(record => ({
        id: record.id,
        licensePlate: record.license_plate,
        entryTime: record.entry_time,
        exitTime: record.exit_time,
        durationMinutes: record.duration_minutes,
        totalAmount: record.total_amount,
        status: record.status,
        vehicleTypeId: record.vehicle_type_id,
        appliedDailyRate: record.applied_daily_rate,
        paymentStatus: record.payment_status,
        paymentMethodId: record.payment_method_id,
        paymentTransactionId: record.payment_transaction_id,
      })) as ParkingRecord[];
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ServiceUnavailableError) {
        throw error;
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }
  }
}
