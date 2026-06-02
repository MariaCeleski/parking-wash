import { apiGet, apiPatch } from './client'
import { WashService } from '../types/washOrders'

export async function listWashServices(): Promise<WashService[]> {
  return apiGet<WashService[]>('/api/wash-services')
}

export async function updateWashServicePrice(id: string, price: number): Promise<WashService> {
  return apiPatch<WashService>(`/api/wash-services/${id}`, { price })
}
