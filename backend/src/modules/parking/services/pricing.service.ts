/**
 * Pricing service for parking fee calculations
 *
 * REGRAS DE NEGÓCIO:
 *
 * 1. Primeira hora: valor configurável por tipo de veículo (ex: R$ 15 para Carro)
 * 2. Frações adicionais: 50% do valor da 1ª hora, por cada 30 minutos (ou fração)
 *    - Ex (Carro R$15): 1h30 = R$15 + R$7,50 = R$22,50
 *    - Ex (Carro R$15): 2h00 = R$15 + R$7,50 + R$7,50 = R$30,00
 * 3. Diária: valor configurável (teto automático quando frações atingem esse valor)
 * 4. Excedente após 24h: inicia nova cobrança
 *
 * Todos os valores são configuráveis pelo usuário via Dashboard > Configurações.
 * A fração é sempre calculada como 50% da 1ª hora do tipo de veículo.
 */

export interface RateSelection {
  amount: number;
  selectedRate: 'hourly' | 'daily' | 'mixed';
}

export interface PricingBreakdown {
  durationMinutes: number;
  totalHours: number;
  fullDays: number;
  remainingMinutes: number;
  dailyCharge: number;
  hourlyCharge: number;
  totalAmount: number;
  description: string;
}

/** Default pricing constants */
const FIRST_HOUR_RATE = 10.00;
const FRACTION_MINUTES = 30;
const DAILY_RATE = 60.00;
const MINUTES_PER_DAY = 1440; // 24h

export class PricingService {

  /**
   * Calculate duration in minutes between entry and exit
   */
  private static calculateDurationMinutes(entry: Date | string, exit: Date | string): number {
    const entryDate = typeof entry === 'string' ? new Date(entry) : entry;
    const exitDate = typeof exit === 'string' ? new Date(exit) : exit;
    const durationMs = exitDate.getTime() - entryDate.getTime();

    if (durationMs < 0) {
      throw new Error('Hora de saída não pode ser anterior à hora de entrada');
    }

    return Math.max(1, Math.floor(durationMs / (1000 * 60)));
  }

  /**
   * Calculate the fee for a period of minutes (within a single day, max 1440 min)
   * Uses the progressive pricing rules:
   * - First 60 min: firstHourRate
   * - Each additional 30 min (or fraction): 50% of firstHourRate
   * - Cap at dailyRate
   */
  private static calculatePeriodFee(
    minutes: number,
    firstHourRate: number = FIRST_HOUR_RATE,
    dailyRate: number = DAILY_RATE
  ): { fee: number; isDailyApplied: boolean; description: string } {
    if (minutes <= 0) {
      return { fee: 0, isDailyApplied: false, description: '' };
    }

    // First hour (any fraction up to 60 min)
    if (minutes <= 60) {
      return {
        fee: firstHourRate,
        isDailyApplied: false,
        description: `1ª hora: R$ ${firstHourRate.toFixed(2)}`,
      };
    }

    // Beyond first hour: calculate additional fractions of 30 min
    // Fraction rate = 50% of firstHourRate
    const fractionRate = firstHourRate * 0.5;
    const additionalMinutes = minutes - 60;
    const additionalFractions = Math.ceil(additionalMinutes / FRACTION_MINUTES);
    const hourlyTotal = firstHourRate + (additionalFractions * fractionRate);

    // If hourly total >= daily rate, cap at daily rate
    if (hourlyTotal >= dailyRate) {
      return {
        fee: dailyRate,
        isDailyApplied: true,
        description: `Diária: R$ ${dailyRate.toFixed(2)}`,
      };
    }

    return {
      fee: parseFloat(hourlyTotal.toFixed(2)),
      isDailyApplied: false,
      description: `1ª hora R$ ${firstHourRate.toFixed(2)} + ${additionalFractions}×30min R$ ${(additionalFractions * fractionRate).toFixed(2)}`,
    };
  }

  /**
   * Calculate the parking fee using the defined rules:
   * 1. First hour: fixed rate (R$ 10)
   * 2. Additional fractions: R$ 5 per 30 min
   * 3. Daily cap: R$ 60 (when hourly exceeds daily)
   * 4. After 24h: new period starts (new daily or fractions)
   */
  static calculateFee(
    entry: Date | string,
    exit: Date | string,
    hourlyRate: number = FIRST_HOUR_RATE,
    dailyRate: number = DAILY_RATE
  ): PricingBreakdown {
    if (hourlyRate < 0) throw new Error('Taxa horária não pode ser negativa');
    if (dailyRate < 0) throw new Error('Taxa diária não pode ser negativa');

    const durationMinutes = this.calculateDurationMinutes(entry, exit);
    const totalHours = Math.ceil(durationMinutes / 60);

    // Full days (24h blocks)
    const fullDays = Math.floor(durationMinutes / MINUTES_PER_DAY);
    const remainingMinutes = durationMinutes % MINUTES_PER_DAY;

    let dailyCharge = 0;
    let hourlyCharge = 0;
    let description = '';

    // Full days: each 24h block = 1 daily rate
    if (fullDays > 0) {
      dailyCharge = fullDays * dailyRate;
      description = `${fullDays} diária${fullDays > 1 ? 's' : ''}: R$ ${dailyCharge.toFixed(2)}`;
    }

    // Remaining period after full days
    if (remainingMinutes > 0) {
      const periodResult = this.calculatePeriodFee(remainingMinutes, hourlyRate, dailyRate);

      if (periodResult.isDailyApplied) {
        dailyCharge += periodResult.fee;
        if (fullDays > 0) {
          description = `${fullDays + 1} diária${fullDays + 1 > 1 ? 's' : ''}: R$ ${dailyCharge.toFixed(2)}`;
        } else {
          description = periodResult.description;
        }
      } else {
        hourlyCharge = periodResult.fee;
        if (fullDays > 0) {
          description += ` + ${periodResult.description}`;
        } else {
          description = periodResult.description;
        }
      }
    }

    const totalAmount = Number((dailyCharge + hourlyCharge).toFixed(2));

    return {
      durationMinutes,
      totalHours,
      fullDays,
      remainingMinutes,
      dailyCharge: Number(dailyCharge.toFixed(2)),
      hourlyCharge: Number(hourlyCharge.toFixed(2)),
      totalAmount,
      description,
    };
  }

  /**
   * Select the best rate for a parking session (backward compatible)
   */
  static selectBestRate(
    entryTime: Date | string,
    exitTime: Date | string,
    hourlyRate: number = FIRST_HOUR_RATE,
    dailyRate: number = DAILY_RATE,
    _preferDaily: boolean = false
  ): RateSelection {
    const breakdown = this.calculateFee(entryTime, exitTime, hourlyRate, dailyRate);

    let selectedRate: 'hourly' | 'daily' | 'mixed';
    if (breakdown.dailyCharge > 0 && breakdown.hourlyCharge > 0) {
      selectedRate = 'mixed';
    } else if (breakdown.dailyCharge > 0) {
      selectedRate = 'daily';
    } else {
      selectedRate = 'hourly';
    }

    return {
      amount: breakdown.totalAmount,
      selectedRate,
    };
  }

  /**
   * Legacy method: Calculate hourly fee (backward compatible with old tests)
   * Uses the new progressive pricing rules internally
   */
  static calculateHourlyFee(
    entry: Date | string,
    exit: Date | string,
    hourlyRate: number = FIRST_HOUR_RATE
  ): number {
    const entryDate = typeof entry === 'string' ? new Date(entry) : entry;
    const exitDate = typeof exit === 'string' ? new Date(exit) : exit;
    const durationMs = exitDate.getTime() - entryDate.getTime();
    const durationMinutes = Math.max(1, Math.floor(durationMs / (1000 * 60)));
    const hours = Math.ceil(durationMinutes / 60);
    const fee = hours * hourlyRate;
    return parseFloat(fee.toFixed(2));
  }

  /**
   * Legacy method: Calculate daily fee (backward compatible with old tests)
   */
  static calculateDailyFee(dailyRate: number): number {
    return parseFloat(dailyRate.toFixed(2));
  }

  /**
   * Legacy method: Compare rates (backward compatible with old tests)
   */
  static compareRates(hourlyRate: number, dailyRate: number): {
    hourly24h: number;
    dailyRate: number;
    dailyIsBetter: boolean;
  } {
    const hourly24h = parseFloat((24 * hourlyRate).toFixed(2));
    const dailyFormatted = parseFloat(dailyRate.toFixed(2));
    return {
      hourly24h,
      dailyRate: dailyFormatted,
      dailyIsBetter: hourly24h >= dailyFormatted,
    };
  }
}
