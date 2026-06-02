import { describe, it, expect } from 'vitest'
import { calculateWashPricing } from './pricing'

describe('calculateWashPricing', () => {
  const hourlyRate = 15
  const dailyRate = 70

  // Helper to create ISO timestamps with a given duration in minutes
  function makeTimestamps(durationMinutes: number) {
    const start = new Date('2024-06-01T10:00:00Z')
    const exit = new Date(start.getTime() + durationMinutes * 60000)
    return { startTime: start.toISOString(), exitTime: exit.toISOString() }
  }

  describe('validation', () => {
    it('should return error when exitTime <= startTime', () => {
      const result = calculateWashPricing(
        '2024-06-01T10:00:00Z',
        '2024-06-01T09:00:00Z',
        hourlyRate,
        dailyRate
      )
      expect(result.error).toBe('A hora de saída deve ser posterior à hora de entrada.')
      expect(result.totalAmount).toBe(0)
    })

    it('should return error when exitTime equals startTime', () => {
      const result = calculateWashPricing(
        '2024-06-01T10:00:00Z',
        '2024-06-01T10:00:00Z',
        hourlyRate,
        dailyRate
      )
      expect(result.error).toBe('A hora de saída deve ser posterior à hora de entrada.')
    })

    it('should return error for invalid timestamps', () => {
      const result = calculateWashPricing('invalid', 'also-invalid', hourlyRate, dailyRate)
      expect(result.error).toBe('Timestamps inválidos.')
    })
  })

  describe('first hour (up to 60 minutes)', () => {
    it('should charge hourlyRate for 15 minutes', () => {
      const { startTime, exitTime } = makeTimestamps(15)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      expect(result.totalAmount).toBe(15)
      expect(result.durationMinutes).toBe(15)
      expect(result.error).toBeUndefined()
    })

    it('should charge hourlyRate for 45 minutes', () => {
      const { startTime, exitTime } = makeTimestamps(45)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      expect(result.totalAmount).toBe(15)
    })

    it('should charge hourlyRate for exactly 60 minutes', () => {
      const { startTime, exitTime } = makeTimestamps(60)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      expect(result.totalAmount).toBe(15)
    })
  })

  describe('fractions after first hour (50% of hourlyRate per 30min)', () => {
    it('should charge hourlyRate + 1 fraction for 1h15', () => {
      const { startTime, exitTime } = makeTimestamps(75)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      // 15 + 7.50 = 22.50
      expect(result.totalAmount).toBe(22.50)
    })

    it('should charge hourlyRate + 1 fraction for 1h30', () => {
      const { startTime, exitTime } = makeTimestamps(90)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      // 15 + 7.50 = 22.50
      expect(result.totalAmount).toBe(22.50)
    })

    it('should charge hourlyRate + 2 fractions for 1h45', () => {
      const { startTime, exitTime } = makeTimestamps(105)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      // 15 + 7.50 + 7.50 = 30.00
      expect(result.totalAmount).toBe(30.00)
    })

    it('should charge hourlyRate + 2 fractions for 2h00', () => {
      const { startTime, exitTime } = makeTimestamps(120)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      // 15 + 7.50 + 7.50 = 30.00
      expect(result.totalAmount).toBe(30.00)
    })

    it('should charge hourlyRate + 3 fractions for 2h30', () => {
      const { startTime, exitTime } = makeTimestamps(150)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      // 15 + 3×7.50 = 37.50
      expect(result.totalAmount).toBe(37.50)
    })

    it('should charge hourlyRate + 4 fractions for 3h00', () => {
      const { startTime, exitTime } = makeTimestamps(180)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      // 15 + 4×7.50 = 45.00
      expect(result.totalAmount).toBe(45.00)
    })
  })

  describe('daily cap', () => {
    it('should cap at dailyRate when fractions exceed it (5h)', () => {
      const { startTime, exitTime } = makeTimestamps(300)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      // 15 + 8×7.50 = 75 → capped at 70
      expect(result.totalAmount).toBe(70)
    })

    it('should cap at dailyRate for 8h', () => {
      const { startTime, exitTime } = makeTimestamps(480)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      expect(result.totalAmount).toBe(70)
    })

    it('should cap at dailyRate for 24h', () => {
      const { startTime, exitTime } = makeTimestamps(1440)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      expect(result.totalAmount).toBe(70)
    })
  })

  describe('multi-day (>24h)', () => {
    it('should charge 1 daily + hourlyRate for 25h', () => {
      const { startTime, exitTime } = makeTimestamps(1500)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      // 1 daily (70) + 1st hour (15) = 85
      expect(result.totalAmount).toBe(85)
    })

    it('should charge 1 daily + hourlyRate + 3 fractions for 26h30', () => {
      const { startTime, exitTime } = makeTimestamps(1590)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      // 1 daily (70) + 1st hour (15) + ceil(90/30)×7.50 = 70 + 15 + 22.50 = 107.50
      expect(result.totalAmount).toBe(107.50)
    })

    it('should charge 2 dailies for 48h', () => {
      const { startTime, exitTime } = makeTimestamps(2880)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      // 2 × 70 = 140
      expect(result.totalAmount).toBe(140)
    })
  })

  describe('duration calculation', () => {
    it('should calculate durationMinutes correctly', () => {
      const { startTime, exitTime } = makeTimestamps(90)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      expect(result.durationMinutes).toBe(90)
    })

    it('should calculate durationSeconds correctly', () => {
      const { startTime, exitTime } = makeTimestamps(90)
      const result = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      expect(result.durationSeconds).toBe(5400)
    })

    it('should have minimum 1 minute for very short durations', () => {
      const start = new Date('2024-06-01T10:00:00Z')
      const exit = new Date(start.getTime() + 30000) // 30 seconds
      const result = calculateWashPricing(start.toISOString(), exit.toISOString(), hourlyRate, dailyRate)
      expect(result.durationMinutes).toBe(1)
      expect(result.durationSeconds).toBe(30)
    })
  })
})
