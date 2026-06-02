/**
 * Vehicle Types Module — Input Validation
 *
 * Zod schemas for validating vehicle type API requests.
 * Ensures name and code meet length and format requirements.
 */

import { z } from 'zod';

/**
 * Schema for creating a new vehicle type
 * Validates:
 * - name: required, 2-50 characters
 * - code: required, 2-20 characters, uppercase alphanumeric + underscore only
 */
export const createVehicleTypeSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  code: z
    .string({ required_error: 'Código é obrigatório' })
    .min(2, 'Código deve ter no mínimo 2 caracteres')
    .max(20, 'Código deve ter no máximo 20 caracteres')
    .regex(/^[A-Z0-9_]+$/, 'Código deve conter apenas letras maiúsculas, números e underscore'),
});

/**
 * Schema for updating an existing vehicle type (only name can be changed)
 * Validates:
 * - name: required, 2-50 characters
 */
export const updateVehicleTypeSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
});

export type CreateVehicleTypeRequest = z.infer<typeof createVehicleTypeSchema>;
export type UpdateVehicleTypeRequest = z.infer<typeof updateVehicleTypeSchema>;
