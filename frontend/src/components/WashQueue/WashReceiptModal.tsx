import { useEffect, useRef } from 'react'
import { WashOrder, WASH_PAYMENT_METHODS } from '../../types/washOrders'
import { formatDateTimeBR, formatDurationHHMMSS, formatCurrencyBRL } from '../../utils/formatters'
import './WashReceiptModal.css'

interface WashReceiptModalProps {
  order: WashOrder
  totalAmount: number
  durationSeconds: number
  paymentMethod: string
  onClose: () => void
}

function getPaymentLabel(methodId: string): string {
  const method = WASH_PAYMENT_METHODS.find((m) => m.id === methodId)
  return method ? method.label : methodId || '—'
}

export default function WashReceiptModal({
  order,
  totalAmount,
  durationSeconds,
  paymentMethod,
  onClose,
}: WashReceiptModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const emissionTimestamp = useRef(new Date().toISOString())

  // Focus trap and keyboard handling
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement

    const focusFirstElement = () => {
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable && focusable.length > 0) {
        focusable[0].focus()
      }
    }

    const timer = setTimeout(focusFirstElement, 50)

    return () => {
      clearTimeout(timer)
      previousFocusRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handlePrint = () => {
    window.print()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const servicePrice = order.washService?.price
  const vehicleTypeName = order.vehicleType?.name

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="wash-receipt-modal receipt-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wash-receipt-title"
        aria-describedby="wash-receipt-body"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="wash-receipt-header">
          <h2 id="wash-receipt-title">RECIBO DE LAVAGEM</h2>
          <p className="receipt-emission">
            Emissão: {formatDateTimeBR(emissionTimestamp.current)}
          </p>
        </div>

        {/* Body */}
        <div className="wash-receipt-body" id="wash-receipt-body">
          <div className="receipt-row">
            <span className="receipt-label">Placa</span>
            <span className="receipt-value plate">
              {order.licensePlate || '—'}
            </span>
          </div>

          {vehicleTypeName && (
            <div className="receipt-row">
              <span className="receipt-label">Tipo Veículo</span>
              <span className="receipt-value">{vehicleTypeName}</span>
            </div>
          )}

          <div className="receipt-row">
            <span className="receipt-label">Serviço</span>
            <span className="receipt-value">
              {order.washService?.name || '—'}
            </span>
          </div>

          <hr className="receipt-divider" />

          <div className="receipt-row">
            <span className="receipt-label">Entrada</span>
            <span className="receipt-value">
              {formatDateTimeBR(order.createdAt)}
            </span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Início</span>
            <span className="receipt-value">
              {formatDateTimeBR(order.startedAt)}
            </span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Conclusão</span>
            <span className="receipt-value">
              {formatDateTimeBR(order.completedAt)}
            </span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Duração</span>
            <span className="receipt-value">
              {formatDurationHHMMSS(durationSeconds)}
            </span>
          </div>

          <hr className="receipt-divider" />

          <div className="receipt-row">
            <span className="receipt-label">Valor Serviço</span>
            <span className="receipt-value">
              {servicePrice != null ? formatCurrencyBRL(servicePrice) : '—'}
            </span>
          </div>

          <div className="wash-receipt-total">
            <span className="receipt-label">Total</span>
            <span className="total-amount receipt-value">
              {formatCurrencyBRL(totalAmount)}
            </span>
          </div>

          <hr className="receipt-divider" />

          <div className="receipt-row">
            <span className="receipt-label">Pagamento</span>
            <span className="receipt-value">
              {getPaymentLabel(paymentMethod)}
            </span>
          </div>

          <div className="wash-receipt-footer">
            Obrigado pela preferência!
          </div>
        </div>

        {/* Actions */}
        <div className="wash-receipt-actions modal-actions">
          <button
            className="receipt-btn print-btn"
            onClick={handlePrint}
            type="button"
          >
            🖨️ Imprimir
          </button>
          <button
            className="receipt-btn close-btn"
            onClick={onClose}
            type="button"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
