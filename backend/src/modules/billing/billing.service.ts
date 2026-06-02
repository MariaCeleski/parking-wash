/**
 * Service layer for billing operations
 * Handles daily billing report generation and revenue analytics
 */

import { supabase } from '../../db/supabase';
import { ServiceUnavailableError } from '../../middleware/errors';
import { DailyBillingReport, VehicleTypeBreakdown } from './billing.types';

export class BillingService {
  /**
   * Generate a daily billing report for the specified date (or today)
   * Queries parking_records with status = "Exited" and exit_time within the given UTC day
   *
   * @param date - Optional date in YYYY-MM-DD format. Defaults to current UTC date.
   * @returns DailyBillingReport with totalRevenue, totalVehicles, and breakdown by vehicle type
   * @throws ServiceUnavailableError if database operation fails
   */
  async getDailyReport(date?: string): Promise<DailyBillingReport> {
    try {
      // Determine the report date (UTC)
      const reportDate = date || new Date().toISOString().split('T')[0];

      // Calculate UTC day boundaries
      const dayStart = `${reportDate}T00:00:00.000Z`;
      const dayEnd = `${reportDate}T23:59:59.999Z`;

      // Query parking records with status = "Exited" and exit_time within the day
      const { data: records, error } = await supabase
        .from('parking_records')
        .select('id, total_amount, vehicle_type_id')
        .eq('status', 'Exited')
        .gte('exit_time', dayStart)
        .lte('exit_time', dayEnd);

      if (error) {
        throw new ServiceUnavailableError(
          'Serviço temporariamente indisponível. Tente novamente em instantes'
        );
      }

      const exitedRecords = records || [];

      // Calculate totals
      const totalRevenue = exitedRecords.reduce(
        (sum, record) => sum + (record.total_amount || 0),
        0
      );
      const totalVehicles = exitedRecords.length;

      // Group by vehicle_type_id
      const groupedByType: Record<string, { count: number; revenue: number }> = {};
      for (const record of exitedRecords) {
        const typeId = record.vehicle_type_id || 'unknown';
        if (!groupedByType[typeId]) {
          groupedByType[typeId] = { count: 0, revenue: 0 };
        }
        groupedByType[typeId].count += 1;
        groupedByType[typeId].revenue += record.total_amount || 0;
      }

      // Fetch vehicle type details for each group
      const vehicleTypeIds = Object.keys(groupedByType).filter(id => id !== 'unknown');
      let vehicleTypesMap: Record<string, { id: string; name: string; code: string }> = {};

      if (vehicleTypeIds.length > 0) {
        const { data: vehicleTypes, error: vtError } = await supabase
          .from('vehicle_types')
          .select('id, name, code')
          .in('id', vehicleTypeIds);

        if (vtError) {
          throw new ServiceUnavailableError(
            'Serviço temporariamente indisponível. Tente novamente em instantes'
          );
        }

        for (const vt of vehicleTypes || []) {
          vehicleTypesMap[vt.id] = { id: vt.id, name: vt.name, code: vt.code };
        }
      }

      // Build byVehicleType breakdown
      const byVehicleType: VehicleTypeBreakdown[] = [];
      for (const [typeId, data] of Object.entries(groupedByType)) {
        if (typeId === 'unknown') {
          // Include records without vehicle type as "Desconhecido"
          byVehicleType.push({
            vehicleType: { id: 'unknown', name: 'Desconhecido', code: 'UNKNOWN' },
            count: data.count,
            revenue: parseFloat(data.revenue.toFixed(2)),
          });
        } else {
          const vehicleType = vehicleTypesMap[typeId];
          if (vehicleType) {
            byVehicleType.push({
              vehicleType,
              count: data.count,
              revenue: parseFloat(data.revenue.toFixed(2)),
            });
          }
        }
      }

      return {
        date: reportDate,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalVehicles,
        byVehicleType,
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
}
