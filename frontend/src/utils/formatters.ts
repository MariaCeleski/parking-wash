/**
 * Formatting utilities for the wash checkout flow
 *
 * Provides consistent pt-BR formatting for dates, durations, and currency values.
 */

/**
 * Formats an ISO 8601 UTC timestamp to DD/MM/YYYY HH:MM:SS in the local timezone.
 * Returns "—" for null, empty, or invalid timestamps.
 */
export function formatDateTimeBR(isoString: string | null): string {
  if (!isoString) return '—'

  const date = new Date(isoString)
  if (isNaN(date.getTime())) return '—'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

/**
 * Formats a duration in seconds to HH:MM:SS format.
 * Hours can exceed 24 (e.g., 72:15:30 for 72 hours, 15 minutes, 30 seconds).
 * Returns "00:00:00" for zero or negative values.
 */
export function formatDurationHHMMSS(totalSeconds: number): string {
  if (totalSeconds < 0 || !Number.isFinite(totalSeconds)) return '00:00:00'

  const intSeconds = Math.floor(totalSeconds)
  const hours = Math.floor(intSeconds / 3600)
  const minutes = Math.floor((intSeconds % 3600) / 60)
  const seconds = intSeconds % 60

  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')

  return `${hh}:${mm}:${ss}`
}

/**
 * Formats a numeric value to Brazilian Real currency format: R$ X.XXX,XX
 * Uses pt-BR separators (dot for thousands, comma for decimals) with 2 decimal places.
 */
export function formatCurrencyBRL(value: number): string {
  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `R$ ${formatted}`
}
