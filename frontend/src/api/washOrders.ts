import { apiGet, apiPost, apiPatch } from './client'
import {
  WashOrder,
  WashOrderStatus,
  CreateWashOrderRequest,
  UpdateWashOrderStatusRequest,
} from '../types/washOrders'

export async function createWashOrder(
  licensePlate: string,
  washServiceId: string,
  vehicleTypeId?: string
): Promise<WashOrder> {
  const body: CreateWashOrderRequest = {
    licensePlate,
    washServiceId,
    ...(vehicleTypeId && { vehicleTypeId }),
  }
  return apiPost<WashOrder>('/api/wash-orders', body)
}

export async function updateWashOrderStatus(
  id: string,
  status: WashOrderStatus
): Promise<WashOrder> {
  const body: UpdateWashOrderStatusRequest = { status }
  return apiPatch<WashOrder>(`/api/wash-orders/${id}/status`, body)
}

export async function listWashOrders(status?: WashOrderStatus): Promise<WashOrder[]> {
  const url = status
    ? `/api/wash-orders?status=${status}`
    : '/api/wash-orders'
  return apiGet<WashOrder[]>(url)
}

export async function listWashOrdersHistory(limit: number = 20, offset: number = 0): Promise<WashOrder[]> {
  return apiGet<WashOrder[]>(`/api/wash-orders/history?limit=${limit}&offset=${offset}`)
}

export interface WashDashboardMetrics {
  totalOrders: number
  completedToday: number
  inProgress: number
  waiting: number
  revenueToday: number
  recentCompleted: Array<{
    id: string
    licensePlate: string
    serviceName: string
    price: number
    completedAt: string
  }>
}

export async function getWashDashboard(): Promise<WashDashboardMetrics> {
  return apiGet<WashDashboardMetrics>('/api/wash-orders/dashboard')
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333'

/**
 * Completa uma ordem de lavagem com método de pagamento.
 * Usa AbortController para suportar cancelamento externo e timeout de 45 segundos.
 * Inclui retry automático (até 2 tentativas) em caso de timeout ou erro de rede.
 *
 * @param id - ID da ordem de lavagem
 * @param paymentMethod - Método de pagamento selecionado (ex: 'cash', 'pix')
 * @param signal - AbortSignal externo opcional para cancelamento pelo chamador
 * @returns A ordem atualizada com status 'Completed'
 */
export async function completeWashOrder(
  id: string,
  paymentMethod: string,
  signal?: AbortSignal
): Promise<WashOrder> {
  const maxRetries = 2
  const timeoutMs = 45000 // 45 segundos de timeout

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    // Se um signal externo for fornecido, abortar quando ele for abortado
    const onExternalAbort = () => controller.abort()
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timeoutId)
        throw new DOMException('The operation was aborted.', 'AbortError')
      }
      signal.addEventListener('abort', onExternalAbort)
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/wash-orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed', paymentMethod }),
        signal: controller.signal,
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const data = await response.json()
          errorMessage = data.error || data.message || errorMessage
        } catch {
          // Ignore JSON parse errors
        }
        // Não fazer retry para erros de validação (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw { error: errorMessage, statusCode: response.status }
        }
        // Para erros de servidor (5xx), tentar novamente
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }
        throw { error: errorMessage, statusCode: response.status }
      }

      return await response.json() as WashOrder
    } catch (err: unknown) {
      // Se foi cancelado pelo usuário (signal externo), não fazer retry
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError')
      }
      // Timeout ou erro de rede — tentar novamente
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }
        throw new DOMException(
          'Tempo de resposta esgotado. Tente novamente.',
          'AbortError'
        )
      }
      throw err
    } finally {
      clearTimeout(timeoutId)
      if (signal) {
        signal.removeEventListener('abort', onExternalAbort)
      }
    }
  }

  // Fallback (não deveria chegar aqui)
  throw new DOMException(
    'Tempo de resposta esgotado. Tente novamente.',
    'AbortError'
  )
}
