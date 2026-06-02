export type WashOrderStatus = 'Waiting' | 'InProgress' | 'Completed';

export interface WashService {
  id: string;
  name: string;
  price: number;
  duration_estimate: number;
}

export interface VehicleType {
  id: string;
  name: string;
  code: string;
  hourlyRate?: number;
  dailyRate?: number;
  isActive?: boolean;
}

export interface WashOrder {
  id: string;
  licensePlate: string;
  washService: Pick<WashService, 'id' | 'name' | 'price'>;
  vehicleType?: VehicleType;
  price: number | null;
  status: WashOrderStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  paymentMethod?: string;
}

export interface CreateWashOrderRequest {
  licensePlate: string;
  washServiceId: string;
  vehicleTypeId?: string;
}

export interface UpdateWashOrderStatusRequest {
  status: WashOrderStatus;
}

export const WASH_PAYMENT_METHODS = [
  { id: 'cash', label: 'Dinheiro' },
  { id: 'debit_card', label: 'Débito' },
  { id: 'credit_card', label: 'Crédito' },
  { id: 'pix', label: 'PIX' },
  { id: 'other', label: 'Outro' },
] as const;

export type WashPaymentMethodId = typeof WASH_PAYMENT_METHODS[number]['id'];
