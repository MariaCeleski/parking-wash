import { apiGet, apiPut, apiDelete } from './client'
import type { WashServicePriceResponse, ResolvePriceResult } from '../types/washServicePrices'

export async function listWashServicePrices(): Promise<WashServicePriceResponse[]> {
  return apiGet<WashServicePriceResponse[]>('/api/wash-service-prices')
}

export async function upsertWashServicePrice(
  vehicleTypeId: string,
  washServiceId: string,
  price: number
): Promise<WashServicePriceResponse> {
  return apiPut<WashServicePriceResponse>('/api/wash-service-prices', {
    vehicleTypeId,
    washServiceId,
    price,
  })
}

export async function deleteWashServicePrice(id: string): Promise<void> {
  await apiDelete<{ message: string }>(`/api/wash-service-prices/${id}`)
}

export async function resolveWashServicePrice(
  vehicleTypeId: string | null,
  washServiceId: string
): Promise<ResolvePriceResult> {
  const params = new URLSearchParams({ washServiceId })
  if (vehicleTypeId) {
    params.set('vehicleTypeId', vehicleTypeId)
  }
  return apiGet<ResolvePriceResult>(`/api/wash-service-prices/resolve?${params.toString()}`)
}
