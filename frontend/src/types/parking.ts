export type ParkingStatus = 'Parked' | 'Exited'

export interface VehicleType {
  id: string
  name: string
  code: string
  hourlyRate: number
  dailyRate: number
  isActive: boolean
}

export interface ParkingRecord {
  id: string
  licensePlate: string
  entryTime: string
  exitTime?: string
  durationMinutes?: number
  totalAmount?: number
  status: ParkingStatus
  vehicleTypeId?: string
  appliedDailyRate?: boolean
  paymentStatus?: string
  paymentMethodId?: string
}

export interface CheckInRequest {
  licensePlate: string
  vehicleTypeId?: string
}

export interface CheckInResponse extends ParkingRecord {}

export interface CheckOutRequest {
  applyDailyRate?: boolean
  paymentMethodId?: string
}

export interface CheckOutResponse extends ParkingRecord {}
