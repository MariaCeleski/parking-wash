/**
 * Pricing calculation utilities for parking
 *
 * REGRAS DE NEGÓCIO:
 * 1. Primeira hora: valor configurável por tipo de veículo
 * 2. Frações adicionais: 50% do valor da 1ª hora, por cada 30 min
 * 3. Diária: valor configurável (teto automático)
 * 4. Excedente após 24h: inicia nova cobrança
 *
 * Todos os valores vêm das configurações do usuário (Dashboard > Configurações).
 */

const FIRST_HOUR_RATE = 10.00
const FRACTION_MINUTES = 30
const DAILY_RATE_DEFAULT = 60.00
const MINUTES_PER_DAY = 1440

export interface PricingCalculation {
  durationMinutes: number
  totalHours: number
  hourlyRate: number
  dailyRate: number
  // Breakdown
  fullDays: number
  remainingMinutes: number
  dailyCharge: number
  hourlyCharge: number
  totalAmount: number
  description: string
  // For display
  rateType: 'hourly' | 'daily' | 'mixed'
}

/**
 * Calculate fee for a period (up to 24h)
 */
function calculatePeriodFee(
  minutes: number,
  firstHourRate: number,
  dailyRate: number
): { fee: number; isDailyApplied: boolean; description: string } {
  if (minutes <= 0) {
    return { fee: 0, isDailyApplied: false, description: '' }
  }

  // First hour (any fraction up to 60 min)
  if (minutes <= 60) {
    return {
      fee: firstHourRate,
      isDailyApplied: false,
      description: `1ª hora: R$ ${firstHourRate.toFixed(2)}`,
    }
  }

  // Beyond first hour: fractions of 30 min = 50% of firstHourRate
  const fractionRate = firstHourRate * 0.5
  const additionalMinutes = minutes - 60
  const additionalFractions = Math.ceil(additionalMinutes / FRACTION_MINUTES)
  const hourlyTotal = firstHourRate + (additionalFractions * fractionRate)

  // Cap at daily rate
  if (hourlyTotal >= dailyRate) {
    return {
      fee: dailyRate,
      isDailyApplied: true,
      description: `Diária: R$ ${dailyRate.toFixed(2)}`,
    }
  }

  return {
    fee: parseFloat(hourlyTotal.toFixed(2)),
    isDailyApplied: false,
    description: `1ª hora + ${additionalFractions}×30min (R$ ${fractionRate.toFixed(2)}/fração)`,
  }
}

/**
 * Calculate parking fee based on the defined rules
 */
export function calculatePricing(
  entryTime: string,
  hourlyRate: number = FIRST_HOUR_RATE,
  dailyRate: number = DAILY_RATE_DEFAULT
): PricingCalculation {
  const entry = new Date(entryTime)
  const now = new Date()
  const diffMs = now.getTime() - entry.getTime()
  const durationMinutes = Math.max(1, Math.floor(diffMs / 60000))
  const totalHours = Math.ceil(durationMinutes / 60)

  // Full days (24h blocks)
  const fullDays = Math.floor(durationMinutes / MINUTES_PER_DAY)
  const remainingMinutes = durationMinutes % MINUTES_PER_DAY

  let dailyCharge = 0
  let hourlyCharge = 0
  let description = ''
  let rateType: 'hourly' | 'daily' | 'mixed' = 'hourly'

  // Full days: each 24h block = 1 daily rate
  if (fullDays > 0) {
    dailyCharge = fullDays * dailyRate
    description = `${fullDays} diária${fullDays > 1 ? 's' : ''}: R$ ${dailyCharge.toFixed(2)}`
    rateType = 'daily'
  }

  // Remaining period after full days
  if (remainingMinutes > 0) {
    const periodResult = calculatePeriodFee(remainingMinutes, hourlyRate, dailyRate)

    if (periodResult.isDailyApplied) {
      dailyCharge += periodResult.fee
      if (fullDays > 0) {
        description = `${fullDays + 1} diária${fullDays + 1 > 1 ? 's' : ''}: R$ ${dailyCharge.toFixed(2)}`
      } else {
        description = periodResult.description
      }
      rateType = 'daily'
    } else {
      hourlyCharge = periodResult.fee
      if (fullDays > 0) {
        description += ` + ${periodResult.description}`
        rateType = 'mixed'
      } else {
        description = periodResult.description
      }
    }
  }

  const totalAmount = Number((dailyCharge + hourlyCharge).toFixed(2))

  return {
    durationMinutes,
    totalHours,
    hourlyRate,
    dailyRate,
    fullDays,
    remainingMinutes,
    dailyCharge,
    hourlyCharge,
    totalAmount,
    description,
    rateType,
  }
}

/**
 * Result of wash pricing calculation
 */
export interface WashPricingResult {
  totalAmount: number
  durationMinutes: number
  durationSeconds: number
  description: string
  error?: string
}

/**
 * Calculate wash pricing based on explicit start and exit times.
 *
 * REGRAS DE NEGÓCIO:
 * 1. Primeira hora (até 60 min): hourlyRate
 * 2. Frações adicionais: 50% da hourlyRate por cada 30 min (ou fração)
 * 3. Teto diário: dailyRate (aplica quando soma progressiva >= dailyRate)
 * 4. Excedente após 24h: cada bloco de 24h = 1 dailyRate, período restante segue regras 1-3
 *
 * @param startTime - ISO 8601 timestamp de início da lavagem
 * @param exitTime - ISO 8601 timestamp de conclusão da lavagem
 * @param hourlyRate - Valor da 1ª hora (configurável por tipo de veículo)
 * @param dailyRate - Teto diário (configurável por tipo de veículo)
 * @returns WashPricingResult com totalAmount, durationMinutes, durationSeconds e description
 */
export function calculateWashPricing(
  startTime: string,
  exitTime: string,
  hourlyRate: number,
  dailyRate: number
): WashPricingResult {
  const start = new Date(startTime)
  const exit = new Date(exitTime)

  // Validate timestamps
  if (isNaN(start.getTime()) || isNaN(exit.getTime())) {
    return {
      totalAmount: 0,
      durationMinutes: 0,
      durationSeconds: 0,
      description: '',
      error: 'Timestamps inválidos.',
    }
  }

  const diffMs = exit.getTime() - start.getTime()

  // Validate exitTime > startTime
  if (diffMs <= 0) {
    return {
      totalAmount: 0,
      durationMinutes: 0,
      durationSeconds: 0,
      description: '',
      error: 'A hora de saída deve ser posterior à hora de entrada.',
    }
  }

  const durationSeconds = Math.floor(diffMs / 1000)
  const durationMinutes = Math.max(1, Math.floor(diffMs / 60000))

  // Full days (24h blocks)
  const fullDays = Math.floor(durationMinutes / MINUTES_PER_DAY)
  const remainingMinutes = durationMinutes % MINUTES_PER_DAY

  let dailyCharge = 0
  let hourlyCharge = 0
  let description = ''

  // Full days: each 24h block = 1 daily rate
  if (fullDays > 0) {
    dailyCharge = fullDays * dailyRate
    description = `${fullDays} diária${fullDays > 1 ? 's' : ''}: R$ ${dailyCharge.toFixed(2)}`
  }

  // Remaining period after full days
  if (remainingMinutes > 0) {
    const periodResult = calculatePeriodFee(remainingMinutes, hourlyRate, dailyRate)

    if (periodResult.isDailyApplied) {
      dailyCharge += periodResult.fee
      if (fullDays > 0) {
        description = `${fullDays + 1} diária${fullDays + 1 > 1 ? 's' : ''}: R$ ${dailyCharge.toFixed(2)}`
      } else {
        description = periodResult.description
      }
    } else {
      hourlyCharge = periodResult.fee
      if (fullDays > 0) {
        description += ` + ${periodResult.description}`
      } else {
        description = periodResult.description
      }
    }
  }

  const totalAmount = Number((dailyCharge + hourlyCharge).toFixed(2))

  return {
    totalAmount,
    durationMinutes,
    durationSeconds,
    description,
  }
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

/**
 * Format currency in BRL
 */
export function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2)}`
}
