/**
 * Settings Service
 * Manages parking lot configuration (total spots, wash spots, etc.)
 * Uses Supabase parking_settings table with key/value pairs
 * Falls back to in-memory storage if table doesn't exist
 */

import { supabase } from '../../db/supabase';

export interface ParkingSettings {
  totalSpots: number;
  washSpots: number;
}

const DEFAULT_TOTAL_SPOTS = 30;
const DEFAULT_WASH_SPOTS = 5;

// In-memory fallback when Supabase table doesn't exist
const memorySettings: Record<string, string> = {};

export class SettingsService {
  /**
   * Get all parking settings
   */
  async getSettings(): Promise<ParkingSettings> {
    try {
      const { data, error } = await supabase
        .from('parking_settings')
        .select('key, value');

      if (error) {
        // Table doesn't exist — use in-memory fallback
        return this.getFromMemory();
      }

      const settings: ParkingSettings = {
        totalSpots: this.getDefaultTotalSpots(),
        washSpots: this.getDefaultWashSpots(),
      };

      for (const row of data || []) {
        if (row.key === 'total_spots') {
          settings.totalSpots = parseInt(row.value, 10) || DEFAULT_TOTAL_SPOTS;
        }
        if (row.key === 'wash_spots') {
          settings.washSpots = parseInt(row.value, 10) || DEFAULT_WASH_SPOTS;
        }
      }

      return settings;
    } catch {
      return this.getFromMemory();
    }
  }

  /**
   * Update settings
   */
  async updateSettings(updates: Partial<ParkingSettings>): Promise<ParkingSettings> {
    const current = await this.getSettings();

    if (updates.totalSpots !== undefined) {
      if (updates.totalSpots < 1 || updates.totalSpots > 9999) {
        throw new Error('Total de vagas deve ser entre 1 e 9999');
      }
      current.totalSpots = updates.totalSpots;
      await this.saveSetting('total_spots', String(updates.totalSpots));
    }

    if (updates.washSpots !== undefined) {
      if (updates.washSpots < 1 || updates.washSpots > 999) {
        throw new Error('Vagas de lavagem deve ser entre 1 e 999');
      }
      current.washSpots = updates.washSpots;
      await this.saveSetting('wash_spots', String(updates.washSpots));
    }

    return current;
  }

  private async saveSetting(key: string, value: string): Promise<void> {
    // Always save to memory
    memorySettings[key] = value;

    try {
      const { error } = await supabase
        .from('parking_settings')
        .upsert(
          { key, value },
          { onConflict: 'key' }
        );

      if (error) {
        console.warn(`[SETTINGS] DB save failed for ${key}, using memory:`, error.message);
      }
    } catch (err) {
      console.warn(`[SETTINGS] Error saving ${key}:`, err);
    }
  }

  private getFromMemory(): ParkingSettings {
    return {
      totalSpots: parseInt(memorySettings['total_spots'] || '', 10) || this.getDefaultTotalSpots(),
      washSpots: parseInt(memorySettings['wash_spots'] || '', 10) || this.getDefaultWashSpots(),
    };
  }

  private getDefaultTotalSpots(): number {
    const envValue = process.env.TOTAL_PARKING_SPOTS;
    if (envValue) {
      const parsed = parseInt(envValue, 10);
      if (parsed > 0) return parsed;
    }
    return DEFAULT_TOTAL_SPOTS;
  }

  private getDefaultWashSpots(): number {
    const envValue = process.env.TOTAL_WASH_SPOTS;
    if (envValue) {
      const parsed = parseInt(envValue, 10);
      if (parsed > 0) return parsed;
    }
    return DEFAULT_WASH_SPOTS;
  }
}
