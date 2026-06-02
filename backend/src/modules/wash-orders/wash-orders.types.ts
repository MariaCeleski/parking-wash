/**
 * Wash Orders Module — Type Definitions
 *
 * Defines all TypeScript interfaces and types for wash order management,
 * including WashOrder, WashService, and related response types.
 */

/**
 * Status of a wash order in the workflow
 * - Waiting: Order created, awaiting service start
 * - InProgress: Service is currently being performed
 * - Completed: Service has been completed
 */
export type WashOrderStatus = 'Waiting' | 'InProgress' | 'Completed';

/**
 * Represents a wash service available in the system
 */
export interface WashService {
  /** Unique identifier (UUID) */
  id: string;
  /** Service name (e.g., "Lavagem Simples", "Lavagem Completa") */
  name: string;
  /** Service price in BRL with 2 decimal places */
  price: number;
  /** Estimated duration in minutes */
  duration_estimate: number;
  /** Whether the service is currently available */
  is_active: boolean;
}

/**
 * Represents a wash order in the database
 * Uses snake_case for database field names (ISO 8601 UTC timestamps)
 */
export interface WashOrder {
  /** Unique identifier (UUID) */
  id: string;
  /** Vehicle license plate (legacy AAA-9999 or Mercosul AAA9A99 format) */
  license_plate: string;
  /** Reference to the WashService (UUID) */
  wash_service_id: string;
  /** Reference to the VehicleType (UUID), optional */
  vehicle_type_id?: string | null;
  /** Fixed price resolved at order creation (NUMERIC(10,2), immutable) */
  price: number;
  /** Current status in the workflow */
  status: WashOrderStatus;
  /** Timestamp when the order was created (ISO 8601 UTC) */
  created_at: string;
  /** Timestamp when the service started, null if not yet started (ISO 8601 UTC) */
  started_at: string | null;
  /** Timestamp when the service was completed, null if not yet completed (ISO 8601 UTC) */
  completed_at: string | null;
  /** Payment method used when completing the order (max 50 chars) */
  payment_method?: string | null;
}

/**
 * Request body for updating a wash order status
 * Used by PATCH /api/wash-orders/:id/status
 */
export interface UpdateWashOrderStatusRequest {
  /** Target status for the order */
  status: WashOrderStatus;
  /** Payment method selected by the operator (used when completing an order) */
  paymentMethod?: string;
}

/**
 * API response format for a wash order
 * Uses camelCase for API response field names
 */
export interface WashOrderResponse {
  /** Unique identifier (UUID) */
  id: string;
  /** Vehicle license plate */
  licensePlate: string;
  /** Embedded wash service details (subset of WashService) */
  washService: {
    id: string;
    name: string;
    price: number;
  };
  /** Vehicle type information, optional */
  vehicleType?: {
    id: string;
    name: string;
    code: string;
  };
  /** Fixed price resolved at order creation (immutable, in BRL) */
  price: number;
  /** Current status in the workflow */
  status: WashOrderStatus;
  /** Timestamp when the order was created (ISO 8601 UTC) */
  createdAt: string;
  /** Timestamp when the service started, null if not yet started (ISO 8601 UTC) */
  startedAt: string | null;
  /** Timestamp when the service was completed, null if not yet completed (ISO 8601 UTC) */
  completedAt: string | null;
  /** Payment method used to complete the order (e.g., cash, debit_card, credit_card, pix, other) */
  paymentMethod?: string;
}
