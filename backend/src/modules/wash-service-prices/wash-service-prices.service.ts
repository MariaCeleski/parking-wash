/**
 * Service layer for wash service prices operations
 * Handles CRUD for price configurations per vehicle type × wash service combination
 * and price resolution logic with fallback cascade
 */

import { supabase } from '../../db/supabase';
import {
  NotFoundError,
  ValidationError,
  ServiceUnavailableError,
} from '../../middleware/errors';
import { WashServicePriceResponse, ResolvePriceResult } from './wash-service-prices.types';

export class WashServicePricesService {
  /**
   * Lists all configured prices with vehicle type and wash service names
   * Performs JOIN on vehicle_types and wash_services to include display names
   * @returns Array of WashServicePriceResponse with entity names
   * @throws ServiceUnavailableError if database operation fails
   */
  async listAll(): Promise<WashServicePriceResponse[]> {
    try {
      const { data, error } = await supabase
        .from('wash_service_prices')
        .select(
          `
          id,
          vehicle_type_id,
          wash_service_id,
          price,
          vehicle_types:vehicle_type_id (name),
          wash_services:wash_service_id (name)
        `
        )
        .order('created_at', { ascending: true });

      if (error) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível'
        );
      }

      return (data || []).map((row: any) => {
        const vehicleType = Array.isArray(row.vehicle_types)
          ? row.vehicle_types[0]
          : row.vehicle_types;
        const washService = Array.isArray(row.wash_services)
          ? row.wash_services[0]
          : row.wash_services;

        return {
          id: row.id,
          vehicleTypeId: row.vehicle_type_id,
          washServiceId: row.wash_service_id,
          price: row.price,
          vehicleTypeName: vehicleType?.name || '',
          washServiceName: washService?.name || '',
        };
      });
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        throw error;
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível'
      );
    }
  }

  /**
   * Creates or updates a price for a vehicle type × wash service combination (upsert)
   * Uses ON CONFLICT DO UPDATE on the unique constraint (vehicle_type_id, wash_service_id)
   * Validates FK existence before attempting the upsert
   *
   * @param vehicleTypeId - UUID of the vehicle type
   * @param washServiceId - UUID of the wash service
   * @param price - Price value (0.01 to 99999999.99)
   * @returns WashServicePriceResponse with entity names
   * @throws NotFoundError if vehicle type or wash service does not exist
   * @throws ServiceUnavailableError if database operation fails
   */
  async upsert(
    vehicleTypeId: string,
    washServiceId: string,
    price: number
  ): Promise<WashServicePriceResponse> {
    try {
      // Validate vehicle type exists
      const { data: vehicleType, error: vtError } = await supabase
        .from('vehicle_types')
        .select('id, name')
        .eq('id', vehicleTypeId)
        .single();

      if (vtError || !vehicleType) {
        if (vtError?.code === 'PGRST116' || !vehicleType) {
          throw new NotFoundError('Tipo de veículo não encontrado');
        }
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível'
        );
      }

      // Validate wash service exists
      const { data: washService, error: wsError } = await supabase
        .from('wash_services')
        .select('id, name')
        .eq('id', washServiceId)
        .single();

      if (wsError || !washService) {
        if (wsError?.code === 'PGRST116' || !washService) {
          throw new NotFoundError('Serviço de lavagem não encontrado');
        }
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível'
        );
      }

      // Perform upsert using ON CONFLICT DO UPDATE
      const now = new Date().toISOString();
      const { data: upserted, error: upsertError } = await supabase
        .from('wash_service_prices')
        .upsert(
          {
            vehicle_type_id: vehicleTypeId,
            wash_service_id: washServiceId,
            price,
            updated_at: now,
          },
          {
            onConflict: 'vehicle_type_id,wash_service_id',
          }
        )
        .select('id, vehicle_type_id, wash_service_id, price')
        .single();

      if (upsertError || !upserted) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível'
        );
      }

      return {
        id: upserted.id,
        vehicleTypeId: upserted.vehicle_type_id,
        washServiceId: upserted.wash_service_id,
        price: upserted.price,
        vehicleTypeName: vehicleType.name,
        washServiceName: washService.name,
      };
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ServiceUnavailableError
      ) {
        throw error;
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível'
      );
    }
  }

  /**
   * Deletes a specific price record by ID
   * Verifies existence before attempting deletion
   *
   * @param id - UUID of the wash service price record
   * @throws NotFoundError if the record does not exist
   * @throws ServiceUnavailableError if database operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      // Verify the record exists
      const { data: existing, error: selectError } = await supabase
        .from('wash_service_prices')
        .select('id')
        .eq('id', id)
        .single();

      if (selectError || !existing) {
        if (selectError?.code === 'PGRST116' || !existing) {
          throw new NotFoundError('Preço não encontrado');
        }
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível'
        );
      }

      // Delete the record
      const { error: deleteError } = await supabase
        .from('wash_service_prices')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível'
        );
      }
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ServiceUnavailableError
      ) {
        throw error;
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível'
      );
    }
  }

  /**
   * Resolves the price for a vehicle type × wash service combination
   * Implements fallback cascade logic:
   * 1. If vehicleTypeId is provided → look up wash_service_prices for that combination
   * 2. If found → use that specific price (isDefault: false)
   * 3. If not found → fallback to wash_services.price (isDefault: true)
   * 4. If vehicleTypeId is null → use wash_services.price directly (isDefault: true)
   * 5. If no price available at all → throw error (422)
   *
   * @param vehicleTypeId - UUID of the vehicle type (or null for default price)
   * @param washServiceId - UUID of the wash service
   * @returns ResolvePriceResult with price and isDefault flag
   * @throws NotFoundError if wash service does not exist
   * @throws ValidationError if no price is configured for the combination
   * @throws ServiceUnavailableError if database operation fails
   */
  async resolvePrice(
    vehicleTypeId: string | null,
    washServiceId: string
  ): Promise<ResolvePriceResult> {
    try {
      // If vehicleTypeId is provided, try to find specific price
      if (vehicleTypeId) {
        const { data: specificPrice, error: spError } = await supabase
          .from('wash_service_prices')
          .select('price')
          .eq('vehicle_type_id', vehicleTypeId)
          .eq('wash_service_id', washServiceId)
          .single();

        if (!spError && specificPrice) {
          return {
            price: specificPrice.price,
            isDefault: false,
          };
        }

        // If error is not "no rows found", it's a real error
        if (spError && spError.code !== 'PGRST116') {
          throw new ServiceUnavailableError(
            'Serviço temporariamente indisponível'
          );
        }
      }

      // Fallback: use wash_services.price (default price)
      const { data: service, error: serviceError } = await supabase
        .from('wash_services')
        .select('price')
        .eq('id', washServiceId)
        .single();

      if (serviceError || !service) {
        if (serviceError?.code === 'PGRST116' || !service) {
          throw new NotFoundError('Serviço de lavagem não encontrado');
        }
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível'
        );
      }

      // Check if the service has a valid default price
      if (service.price == null || service.price <= 0) {
        throw new ValidationError(
          'Não há preço configurado para esta combinação de veículo e serviço'
        );
      }

      return {
        price: service.price,
        isDefault: true,
      };
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ValidationError ||
        error instanceof ServiceUnavailableError
      ) {
        throw error;
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível'
      );
    }
  }
}
