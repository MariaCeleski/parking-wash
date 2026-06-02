/**
 * Wash Service Prices Module — Input Validation
 *
 * Zod schemas for validating wash service price API requests.
 * Ensures vehicle type and wash service IDs are valid UUIDs
 * and price values are within the allowed range with proper precision.
 */

import { z } from 'zod';

/**
 * Schema for creating or updating a wash service price (upsert operation)
 * Validates:
 * - vehicleTypeId: required, valid UUID
 * - washServiceId: required, valid UUID
 * - price: required, number between 0.01 and 99999999.99, max 2 decimal places
 */
export const upsertPriceSchema = z.object({
  vehicleTypeId: z.string().uuid('vehicleTypeId deve ser um UUID válido'),
  washServiceId: z.string().uuid('washServiceId deve ser um UUID válido'),
  price: z
    .number({ required_error: 'Preço é obrigatório', invalid_type_error: 'Preço deve ser um número' })
    .min(0.01, 'Preço deve ser no mínimo 0.01')
    .max(99999999.99, 'Preço deve ser no máximo 99999999.99')
    .multipleOf(0.01, 'Preço deve ter no máximo 2 casas decimais'),
});

/**
 * TypeScript type inferred from upsertPriceSchema
 */
export type UpsertPriceRequest = z.infer<typeof upsertPriceSchema>;
