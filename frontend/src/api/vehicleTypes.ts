import { apiGet, apiPost, apiPut, apiPatch } from './client'
import type { VehicleType } from '../types/parking'

export async function getVehicleTypes(): Promise<VehicleType[]> {
  return apiGet<VehicleType[]>('/api/vehicle-types')
}

export async function getAllVehicleTypes(): Promise<VehicleType[]> {
  return apiGet<VehicleType[]>('/api/vehicle-types?includeInactive=true')
}

export async function createVehicleType(name: string, code: string): Promise<VehicleType> {
  return apiPost<VehicleType>('/api/vehicle-types', { name, code })
}

export async function updateVehicleType(id: string, name: string): Promise<VehicleType> {
  return apiPut<VehicleType>(`/api/vehicle-types/${id}`, { name })
}

export async function toggleVehicleTypeActive(id: string): Promise<VehicleType> {
  return apiPatch<VehicleType>(`/api/vehicle-types/${id}/toggle-active`, {})
}
