/**
 * Wash Orders Module — Input Validation
 *
 * Zod schemas for validating wash order API requests.
 * Ensures license plates follow Brazilian formats (legacy and Mercosul)
 * and wash service IDs are valid UUIDs.
 */

import { z } from 'zod';

/**
 * Regex patterns for Brazilian license plates
 * - Legacy format: AAA-9999 (3 letters, hyphen, 4 digits)
 * - Mercosul format: AAA9A99 (3 letters, 1 digit, 1 letter, 2 digits)
 */
const LEGACY_PLATE_REGEX = /^[A-Z]{3}-\d{4}$/;
const MERCOSUL_PLATE_REGEX = /^[A-Z]{3}\d[A-Z]\d{2}$/;

/**
 * Validates a Brazilian license plate
 * Accepts both legacy (AAA-9999) and Mercosul (AAA9A99) formats
 */
const licensePlateSchema = z
  .string()
  .min(1, 'Placa é obrigatória')
  .refine(
    (plate) => LEGACY_PLATE_REGEX.test(plate) || MERCOSUL_PLATE_REGEX.test(plate),
    'Placa inválida. Use o formato AAA-9999 ou AAA9A99'
  );

/**
 * Validates a UUID v4 format
 */
const uuidSchema = z
  .string()
  .uuid('ID deve ser um UUID válido');

/**
 * Schema for creating a new wash order
 * Validates: licensePlate (required, valid format), washServiceId (required, valid UUID),
 * and vehicleTypeId (optional, valid UUID)
 */
export const createWashOrderSchema = z.object({
  licensePlate: licensePlateSchema,
  washServiceId: uuidSchema,
  vehicleTypeId: uuidSchema.optional(),
});

/**
 * TypeScript type inferred from createWashOrderSchema
 */
export type CreateWashOrderRequest = z.infer<typeof createWashOrderSchema>;

/**
 * Schema for updating wash order status
 * Validates: status must be one of the valid WashOrderStatus values
 * Optional paymentMethod: string with max 50 characters (used when completing an order)
 */
export const updateWashOrderStatusSchema = z.object({
  status: z.enum(['Waiting', 'InProgress', 'Completed'], {
    errorMap: () => ({
      message: 'Status inválido. Valores aceitos: Waiting, InProgress, Completed',
    }),
  }),
  paymentMethod: z
    .string()
    .max(50, 'Método de pagamento deve ter no máximo 50 caracteres')
    .optional(),
});

/**
 * TypeScript type inferred from updateWashOrderStatusSchema
 */
export type UpdateWashOrderStatusRequest = z.infer<typeof updateWashOrderStatusSchema>;

/**
 * Schema for listing wash orders with optional status filter
 * Validates: status (optional) must be one of the valid WashOrderStatus values
 */
export const listWashOrdersSchema = z.object({
  status: z
    .enum(['Waiting', 'InProgress', 'Completed'], {
      errorMap: () => ({
        message: 'Status inválido. Valores aceitos: Waiting, InProgress, Completed',
      }),
    })
    .optional(),
});

/**
 * TypeScript type inferred from listWashOrdersSchema
 */
export type ListWashOrdersQuery = z.infer<typeof listWashOrdersSchema>;
