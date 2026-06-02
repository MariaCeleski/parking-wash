import { apiGet, apiPatch } from './client'

export interface ParkingSettings {
  totalSpots: number
  washSpots: number
}

export async function getSettings(): Promise<ParkingSettings> {
  return apiGet<ParkingSettings>('/api/settings')
}

export async function updateSettings(settings: Partial<ParkingSettings>): Promise<ParkingSettings> {
  return apiPatch<ParkingSettings>('/api/settings', settings)
}
