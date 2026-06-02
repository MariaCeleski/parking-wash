import { useEffect } from 'react'
import './CheckoutReceipt.css'

interface ReceiptData {
  licensePlate: string
  vehicleTypeName?: string
  entryTime: string
  exitTime: string
  durationMinutes: number
  totalAmount: number
  paymentMethod: string
  rateDescription: string
}

interface CheckoutReceiptProps {
  data: ReceiptData
  onClose: () => void
}

const PAYMENT_LABELS: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
  pix: 'PIX',
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

export default function CheckoutReceipt({ data, onClose }: CheckoutReceiptProps) {
  useEffect(() => {
    return () => {
      document.body.classList.remove('printing-receipt')
    }
  }, [])

  const handlePrint = () => {
    document.body.classList.add('printing-receipt')
    window.print()
    document.body.classList.remove('printing-receipt')
  }

  return (
    <div className="modal-overlay receipt-overlay" onClick={onClose}>
      <div className="receipt-modal" id="receipt-print-area" onClick={(e) => e.stopPropagation()}>
        {/* Success header */}
        <div className="receipt-success">
          <div className="success-checkmark">✓</div>
          <h2>Checkout Realizado!</h2>
          <p>Pagamento confirmado com sucesso</p>
        </div>

        {/* Receipt body */}
        <div className="receipt-body">
          <div className="receipt-header-line">
            <span>🅿️ ParkingWash</span>
            <span className="receipt-date">{formatDateTime(data.exitTime)}</span>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-row">
            <span className="receipt-label">Placa</span>
            <span className="receipt-value plate">{data.licensePlate}</span>
          </div>

          {data.vehicleTypeName && (
            <div className="receipt-row">
              <span className="receipt-label">Tipo</span>
              <span className="receipt-value">{data.vehicleTypeName}</span>
            </div>
          )}

          <div className="receipt-row">
            <span className="receipt-label">Entrada</span>
            <span className="receipt-value">{formatDateTime(data.entryTime)}</span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Saída</span>
            <span className="receipt-value">{formatDateTime(data.exitTime)}</span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Permanência</span>
            <span className="receipt-value">{formatDuration(data.durationMinutes)}</span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Cálculo</span>
            <span className="receipt-value">{data.rateDescription}</span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Pagamento</span>
            <span className="receipt-value">
              {PAYMENT_LABELS[data.paymentMethod] || data.paymentMethod}
            </span>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-total">
            <span>Total Pago</span>
            <span className="total-amount">R$ {data.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="receipt-actions">
          <button className="receipt-btn print-btn" onClick={handlePrint}>
            🖨️ Imprimir
          </button>
          <button className="receipt-btn close-btn" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
