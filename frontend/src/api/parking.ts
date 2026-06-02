import { apiGet, apiPost } from './client'
import type { ParkingRecord, CheckInRequest, CheckOutRequest } from '../types/parking'

export async function checkIn(request: CheckInRequest | string): Promise<ParkingRecord> {
  const payload = typeof request === 'string' 
    ? { licensePlate: request }
    : request
  return apiPost<ParkingRecord>('/api/parking/checkin', payload)
}

export async function checkOut(id: string, request?: CheckOutRequest): Promise<ParkingRecord> {
  return apiPost<ParkingRecord>(`/api/parking/${id}/checkout`, request || {})
}

export async function listParking(status?: string): Promise<ParkingRecord[]> {
  const url = status ? `/api/parking?status=${status}` : '/api/parking'
  return apiGet<ParkingRecord[]>(url)
}

export async function getHistory(limit: number = 20, offset: number = 0): Promise<ParkingRecord[]> {
  return apiGet<ParkingRecord[]>(`/api/parking/history?limit=${limit}&offset=${offset}`)
}

export interface DashboardMetrics {
  revenueToday: number
  checkoutsToday: number
  entriesTotal: number
  currentOccupancy: number
  avgDurationMinutes: number
  recentCheckouts: Array<{
    id: string
    licensePlate: string
    totalAmount: number
    durationMinutes: number
    exitTime: string
  }>
}

export async function getDashboard(): Promise<DashboardMetrics> {
  return apiGet<DashboardMetrics>('/api/parking/dashboard')
}

export async function getFipeData(licensePlate: string): Promise<any> {
  return apiGet(`/api/parking/fipe/${licensePlate}`)
}
