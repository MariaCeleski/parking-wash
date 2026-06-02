import { useState, useEffect } from 'react'
import { WashOrder, WashOrderStatus } from '../../types/washOrders'
import { updateWashOrderStatus } from '../../api/washOrders'
import WashConfirmationModal from './WashConfirmationModal'
import WashReceiptModal from './WashReceiptModal'
import { calculateWashPricing } from '../../utils/pricing'
import './WashOrderCard.css'

interface WashOrderCardProps {
  order: WashOrder
  onStatusUpdated: () => void
  onOrderCompleted?: (orderId: string) => void
}

interface CompletedOrderData {
  order: WashOrder
  totalAmount: number
  durationSeconds: number
  paymentMethod: string
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function calculateElapsed(startIso: string, endIso?: string | null): string {
  const start = new Date(startIso).getTime()
  const end = endIso ? new Date(endIso).getTime() : Date.now()
  const diffMs = Math.max(0, end - start)

  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function WashOrderCard({ order, onStatusUpdated, onOrderCompleted }: WashOrderCardProps): JSX.Element {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState<string>('')
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [completedOrderData, setCompletedOrderData] = useState<CompletedOrderData | null>(null)

  // Timer para atualizar tempo de permanência em tempo real
  useEffect(() => {
    if (order.status === 'Completed') {
      // Se concluído, calcular tempo fixo entre início e conclusão
      if (order.startedAt && order.completedAt) {
        setElapsed(calculateElapsed(order.startedAt, order.completedAt))
      }
      return
    }

    if (order.status === 'InProgress' && order.startedAt) {
      // Se em progresso, atualizar a cada segundo
      const update = () => setElapsed(calculateElapsed(order.startedAt!))
      update()
      const interval = setInterval(update, 1000)
      return () => clearInterval(interval)
    }

    // Se aguardando, mostrar tempo desde criação
    const update = () => setElapsed(calculateElapsed(order.createdAt))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [order.status, order.startedAt, order.completedAt, order.createdAt])

  const getNextStatus = (): WashOrderStatus | null => {
    if (order.status === 'Waiting') return 'InProgress'
    if (order.status === 'InProgress') return 'Completed'
    return null
  }

  const getButtonLabel = (): string => {
    if (order.status === 'Waiting') return 'Iniciar'
    if (order.status === 'InProgress') return 'Concluir'
    return 'Concluído'
  }

  const handleStatusUpdate = async () => {
    const nextStatus = getNextStatus()
    if (!nextStatus) return

    // When status is InProgress, open the checkout modal instead of calling API directly
    if (order.status === 'InProgress') {
      setShowCheckoutModal(true)
      return
    }

    // For Waiting → InProgress, keep existing behavior
    setLoading(true)
    setError(null)

    try {
      await updateWashOrderStatus(order.id, nextStatus)
      onStatusUpdated()
    } catch (err: unknown) {
      let errorMsg = 'Erro inesperado. Tente novamente.'

      if (err instanceof Error) {
        errorMsg = err.message
      } else if (err && typeof err === 'object' && 'error' in err) {
        errorMsg = (err as { error: string }).error
      }

      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckoutClose = () => {
    setShowCheckoutModal(false)
  }

  const handleCheckoutSuccess = (completedOrder: WashOrder) => {
    setShowCheckoutModal(false)

    // Trigger optimistic local update immediately (Requirement 11.3)
    if (onOrderCompleted) {
      onOrderCompleted(order.id)
    }

    // Calculate pricing for the receipt using the completed order data
    const startTime = completedOrder.startedAt || order.startedAt
    const exitTime = completedOrder.completedAt || new Date().toISOString()
    const hourlyRate = completedOrder.vehicleType?.hourlyRate || order.vehicleType?.hourlyRate || 0
    const dailyRate = completedOrder.vehicleType?.dailyRate || order.vehicleType?.dailyRate || 0

    let totalAmount = 0
    let durationSeconds = 0

    if (startTime && hourlyRate > 0 && dailyRate > 0) {
      const pricing = calculateWashPricing(startTime, exitTime, hourlyRate, dailyRate)
      totalAmount = pricing.totalAmount
      durationSeconds = pricing.durationSeconds
    } else if (startTime) {
      // Fallback: calculate duration even without rates
      const diffMs = new Date(exitTime).getTime() - new Date(startTime).getTime()
      durationSeconds = Math.max(0, Math.floor(diffMs / 1000))
    }

    setCompletedOrderData({
      order: completedOrder,
      totalAmount,
      durationSeconds,
      paymentMethod: completedOrder.paymentMethod || 'cash',
    })
    setShowReceiptModal(true)
  }

  const handleReceiptClose = () => {
    setShowReceiptModal(false)
    setCompletedOrderData(null)
    onStatusUpdated()
  }

  const isButtonDisabled = order.status === 'Completed' || loading

  return (
    <div className="wash-order-card">
      <div className="order-info">
        <div className="info-row">
          <strong>Placa:</strong> <span className="plate">{order.licensePlate}</span>
        </div>
        {order.vehicleType && (
          <div className="info-row">
            <strong>Tipo:</strong> <span className="vehicle-type">{order.vehicleType.name}</span>
          </div>
        )}
        <div className="info-row">
          <strong>Serviço:</strong> {order.washService.name} - R$ {order.washService.price.toFixed(2)}
        </div>
        <div className="info-row">
          <strong>Entrada:</strong> {formatDateTime(order.createdAt)}
        </div>
        {order.startedAt && (
          <div className="info-row">
            <strong>Início:</strong> {formatDateTime(order.startedAt)}
          </div>
        )}
        {order.completedAt && (
          <div className="info-row">
            <strong>Saída:</strong> {formatDateTime(order.completedAt)}
          </div>
        )}
        <div className="info-row">
          <strong>Permanência:</strong>{' '}
          <span className="elapsed-time">{elapsed}</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        onClick={handleStatusUpdate}
        disabled={isButtonDisabled}
        className="action-button"
      >
        {loading ? 'Atualizando...' : getButtonLabel()}
      </button>

      {showCheckoutModal && (
        <WashConfirmationModal
          order={order}
          onClose={handleCheckoutClose}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {showReceiptModal && completedOrderData && (
        <WashReceiptModal
          order={completedOrderData.order}
          totalAmount={completedOrderData.totalAmount}
          durationSeconds={completedOrderData.durationSeconds}
          paymentMethod={completedOrderData.paymentMethod}
          onClose={handleReceiptClose}
        />
      )}
    </div>
  )
}
