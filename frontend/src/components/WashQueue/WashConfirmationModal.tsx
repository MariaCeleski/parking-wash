import { useState, useEffect, useRef, useCallback } from 'react'
import { WashOrder, WASH_PAYMENT_METHODS, WashPaymentMethodId } from '../../types/washOrders'
import { completeWashOrder } from '../../api/washOrders'
import { formatCurrencyBRL } from '../../utils/formatters'
import '../ParkingPanel/CheckoutModal.css'
import './WashConfirmationModal.css'

interface WashConfirmationModalProps {
  order: WashOrder
  onClose: () => void
  onSuccess: (completedOrder: WashOrder) => void
}

/**
 * Validates that the order has a valid price for checkout.
 * Returns an error message if validation fails, or null if valid.
 */
function validateOrderForCheckout(order: WashOrder): string | null {
  if (order.price === null || order.price === undefined || order.price <= 0) {
    return 'Preço não disponível para esta ordem. Não é possível confirmar o pagamento.'
  }
  return null
}

export default function WashConfirmationModal({
  order,
  onClose,
  onSuccess,
}: WashConfirmationModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<WashPaymentMethodId>('cash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  const abortControllerRef = useRef<AbortController | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLSelectElement>(null)
  const triggerElementRef = useRef<Element | null>(null)

  // Pre-opening validation
  const validationError = validateOrderForCheckout(order)

  // Online/offline detection
  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true)
      setError('Sem conexão com a internet. Verifique sua conexão e tente novamente.')
    }
    const handleOnline = () => {
      setIsOffline(false)
      setError('')
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  // Save trigger element on mount, restore focus on unmount
  useEffect(() => {
    triggerElementRef.current = document.activeElement
    return () => {
      if (triggerElementRef.current && triggerElementRef.current instanceof HTMLElement) {
        triggerElementRef.current.focus()
      }
    }
  }, [])

  // Cleanup AbortController on unmount (cancel pending request on close)
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  // Focus management: move focus to first interactive element on mount
  useEffect(() => {
    if (!validationError) {
      firstFocusableRef.current?.focus()
    }
  }, [validationError])

  // Keyboard: Escape closes modal + Focus trap (Tab/Shift+Tab)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose()
        return
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableSelectors = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(focusableSelectors)

        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [loading, onClose])

  const handleOverlayClick = useCallback(() => {
    if (!loading) {
      onClose()
    }
  }, [loading, onClose])

  const handlePay = async () => {
    if (loading || isOffline) return

    setLoading(true)
    setError('')

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const completedOrder = await completeWashOrder(
        order.id,
        paymentMethod,
        controller.signal
      )
      onSuccess(completedOrder)
    } catch (err: unknown) {
      // If aborted by user closing modal, don't show error
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Tempo de resposta esgotado. Tente novamente.')
        return
      }

      let errorMsg = 'Erro inesperado. Tente novamente.'

      if (err && typeof err === 'object' && 'error' in err) {
        const apiErr = err as { error: string; statusCode?: number }
        errorMsg = apiErr.error || errorMsg

        if (apiErr.statusCode === 404) {
          setError('A ordem foi removida. Atualizando a fila...')
          setTimeout(() => onClose(), 3000)
          return
        }
        if (apiErr.statusCode === 422) {
          errorMsg = 'A ordem já foi concluída por outro operador.'
        }
      } else if (err instanceof Error) {
        errorMsg = err.message
      }

      setError(errorMsg)
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  // If validation fails (price is null/zero/negative), show error state
  if (validationError) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wash-confirm-title"
        >
          <h2 id="wash-confirm-title">Erro</h2>
          <div className="error-message">{validationError}</div>
          <div className="modal-actions">
            <button className="button cancel-button" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isPayDisabled = loading || isOffline

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wash-confirm-title"
        aria-describedby="wash-confirm-info"
      >
        <h2 id="wash-confirm-title">Confirmar Conclusão de Lavagem</h2>

        <div className="checkout-info" id="wash-confirm-info">
          <div className="info-row">
            <span className="label">Placa:</span>
            <span className="value">{order.licensePlate}</span>
          </div>

          {order.vehicleType && (
            <div className="info-row">
              <span className="label">Tipo de Veículo:</span>
              <span className="value">{order.vehicleType.name}</span>
            </div>
          )}

          <div className="info-row">
            <span className="label">Serviço:</span>
            <span className="value">{order.washService.name}</span>
          </div>

          <div className="info-row">
            <span className="label">Valor Total:</span>
            <span className="value">{formatCurrencyBRL(order.price!)}</span>
          </div>
        </div>

        <div className="payment-section">
          <label htmlFor="wash-payment-method">Método de Pagamento</label>
          <select
            id="wash-payment-method"
            ref={firstFocusableRef}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as WashPaymentMethodId)}
            disabled={loading}
            className="payment-select"
          >
            {WASH_PAYMENT_METHODS.map((method) => (
              <option key={method.id} value={method.id}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-actions">
          <button
            className="button cancel-button"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="button confirm-button"
            onClick={handlePay}
            disabled={isPayDisabled}
          >
            {loading
              ? 'Processando...'
              : `Pagar ${formatCurrencyBRL(order.price!)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
