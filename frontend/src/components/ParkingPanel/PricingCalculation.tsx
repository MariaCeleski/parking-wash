import { type PricingCalculation, formatDuration, formatBRL } from '../../utils/pricing'
import './PricingCalculation.css'

interface PricingCalculationProps {
  calculation: PricingCalculation
}

export default function PricingCalculationComponent({
  calculation,
}: PricingCalculationProps) {
  return (
    <div className="pricing-calculation">
      {/* Header com duração */}
      <div className="pricing-header">
        <span className="pricing-icon">🕐</span>
        <div className="pricing-header-info">
          <span className="pricing-duration">{formatDuration(calculation.durationMinutes)}</span>
          <span className="pricing-hours-detail">
            {calculation.totalHours}h cobrada{calculation.totalHours > 1 ? 's' : ''} (arredondado)
          </span>
        </div>
      </div>

      {/* Regras aplicadas */}
      <div className="pricing-rules">
        <div className="rule-info">
          <span className="rule-icon">📋</span>
          <span className="rule-text">{calculation.description}</span>
        </div>
      </div>

      {/* Breakdown detalhado */}
      <div className="pricing-breakdown">
        {calculation.dailyCharge > 0 && (
          <div className="breakdown-row">
            <span className="breakdown-label">
              📅 {(() => {
                const numDiarias = Math.round(calculation.dailyCharge / calculation.dailyRate) || 1
                return `${numDiarias} diária${numDiarias > 1 ? 's' : ''}`
              })()}
            </span>
            <span className="breakdown-value">{formatBRL(calculation.dailyCharge)}</span>
          </div>
        )}

        {calculation.hourlyCharge > 0 && (
          <div className="breakdown-row">
            <span className="breakdown-label">
              ⏱️ Frações
            </span>
            <span className="breakdown-value">{formatBRL(calculation.hourlyCharge)}</span>
          </div>
        )}
      </div>

      {/* Nota sobre a regra */}
      <div className="pricing-note">
        <span className="note-icon">ℹ️</span>
        <span className="note-text">
          {calculation.rateType === 'hourly' && `1ª hora + frações de 30min (50% da tarifa horária)`}
          {calculation.rateType === 'daily' && `Diária aplicada (valor horário atingiu o teto)`}
          {calculation.rateType === 'mixed' && `Diárias completas + frações excedentes`}
        </span>
      </div>

      {/* Valor final */}
      <div className="pricing-final">
        <div className="final-label">Total a pagar</div>
        <div className="final-amount">{formatBRL(calculation.totalAmount)}</div>
      </div>
    </div>
  )
}
