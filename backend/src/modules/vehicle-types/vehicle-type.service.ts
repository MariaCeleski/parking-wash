import { supabase } from '../../db/supabase';
import { ServiceUnavailableError, NotFoundError, ValidationError } from '../../middleware/errors';
import { VehicleType } from './vehicle-type.types';

export class VehicleTypeService {
  /**
   * Map database row to VehicleType interface
   * Converts snake_case fields from database to camelCase
   */
  private mapToVehicleType(row: any): VehicleType {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      hourlyRate: row.hourly_rate,
      dailyRate: row.daily_rate,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listActive(): Promise<VehicleType[]> {
    const { data, error } = await supabase
      .from('vehicle_types')
      .select('id, name, code, hourly_rate, daily_rate, is_active, created_at, updated_at')
      .eq('is_active', true);

    if (error) {
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }

    return (data || []).map(row => this.mapToVehicleType(row));
  }

  async listAll(): Promise<VehicleType[]> {
    const { data, error } = await supabase
      .from('vehicle_types')
      .select('id, name, code, hourly_rate, daily_rate, is_active, created_at, updated_at')
      .order('name');

    if (error) {
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }

    return (data || []).map(row => this.mapToVehicleType(row));
  }

  async getById(id: string): Promise<VehicleType> {
    const { data, error } = await supabase
      .from('vehicle_types')
      .select('id, name, code, hourly_rate, daily_rate, is_active, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        throw new NotFoundError('Tipo de veículo não encontrado');
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }

    return this.mapToVehicleType(data);
  }

  async updateRates(
    id: string,
    hourlyRate: number,
    dailyRate: number
  ): Promise<VehicleType> {
    // Validate rates are >= 0.01
    if (hourlyRate < 0.01 || dailyRate < 0.01) {
      throw new ValidationError(
        'As tarifas devem ser maiores que 0.01'
      );
    }

    // Update the vehicle type with new rates
    const { data, error } = await supabase
      .from('vehicle_types')
      .update({
        hourly_rate: hourlyRate,
        daily_rate: dailyRate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, name, code, hourly_rate, daily_rate, is_active, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        throw new NotFoundError('Tipo de veículo não encontrado');
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }

    return this.mapToVehicleType(data);
  }

  /**
   * Create a new vehicle type
   * Validates code uniqueness before creation
   */
  async create(name: string, code: string): Promise<VehicleType> {
    // Check if code already exists
    const { data: existing, error: checkError } = await supabase
      .from('vehicle_types')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (checkError) {
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }

    if (existing) {
      throw new ValidationError('Código já está em uso');
    }

    const { data, error } = await supabase
      .from('vehicle_types')
      .insert({
        name,
        code,
        hourly_rate: 0.01,
        daily_rate: 0.01,
        is_active: true,
      })
      .select('id, name, code, hourly_rate, daily_rate, is_active, created_at, updated_at')
      .single();

    if (error) {
      // Handle unique constraint violation at DB level (race condition)
      if (error.code === '23505') {
        throw new ValidationError('Código já está em uso');
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }

    return this.mapToVehicleType(data);
  }

  /**
   * Update an existing vehicle type's name (code is immutable)
   */
  async update(id: string, name: string): Promise<VehicleType> {
    const { data, error } = await supabase
      .from('vehicle_types')
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, name, code, hourly_rate, daily_rate, is_active, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Tipo de veículo não encontrado');
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }

    return this.mapToVehicleType(data);
  }

  /**
   * Toggle the is_active status of a vehicle type
   */
  async toggleActive(id: string): Promise<VehicleType> {
    // First get the current state
    const current = await this.getById(id);

    const { data, error } = await supabase
      .from('vehicle_types')
      .update({
        is_active: !current.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, name, code, hourly_rate, daily_rate, is_active, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Tipo de veículo não encontrado');
      }
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível. Tente novamente em instantes'
      );
    }

    return this.mapToVehicleType(data);
  }
}
