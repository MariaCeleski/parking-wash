export interface WashServicePriceResponse {
  id: string;
  vehicleTypeId: string;
  washServiceId: string;
  price: number;
  vehicleTypeName: string;
  washServiceName: string;
}

export interface ResolvePriceResult {
  price: number;
  isDefault: boolean;
}
