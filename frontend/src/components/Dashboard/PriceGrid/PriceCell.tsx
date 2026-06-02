import { useState, useRef, useEffect, useCallback } from 'react'
import { upsertWashServicePrice, deleteWashServicePrice } from '../../../api/washServicePrices'
import { formatBRL } from '../../../utils/pricing'
import type { WashServicePriceResponse } from '../../../types/washServicePrices'
import './PriceCell.css'

interface PriceCellProps {
  vehicleTypeId: string
  washServiceId: string
  configuredPrice: WashServicePriceResponse | null
  defaultPrice: number
  onPriceChange: () => void
}

type CellStatus = 'idle' | 'editing' | 'saving' | 'success' | 'error'

/**
 * Validates a price value:
 * - Must be between 0.01 and 999999.99
 * - Must have at most 2 decimal places
 */
function validatePrice(value: string): { valid: boolean; error?: string; numericValue?: number } {
  const trimmed = value.trim().replace(',', '.')

  if (!trimmed) {
    return { valid: false, error: 'Informe um valor' }
  }

  const num = parseFloat(trimmed)

  if (isNaN(num)) {
    return { valid: false, error: 'Valor inválido' }
  }

  if (num < 0.01) {
    return { valid: false, error: 'Mínimo: R$ 0,01' }
  }

  if (num > 999999.99) {
    return { valid: false, error: 'Máximo: R$ 999.999,99' }
  }

  // Check max 2 decimal places
  const parts = trimmed.split('.')
  if (parts.length === 2 && parts[1].length > 2) {
    return { valid: false, error: 'Máximo 2 casas decimais' }
  }

  return { valid: true, numericValue: num }
}

export default function PriceCell({
  vehicleTypeId,
  washServiceId,
  configuredPrice,
  defaultPrice,
  onPriceChange,
}: PriceCellProps) {
  const [status, setStatus] = useState<CellStatus>('idle')
  const [editValue, setEditValue] = useState('')
  const [validationError, setValidationError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDefault = !configuredPrice
  const displayPrice = configuredPrice ? configuredPrice.price : defaultPrice

  // Focus input when entering edit mode
  useEffect(() => {
    if (status === 'editing' && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [status])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
    }
  }, [])

  const handleClick = useCallback(() => {
    if (status === 'idle' || status === 'success' || status === 'error') {
      setEditValue(displayPrice.toFixed(2))
      setValidationError('')
      setErrorMessage('')
      setStatus('editing')
    }
  }, [status, displayPrice])

  const handleCancel = useCallback(() => {
    setStatus('idle')
    setEditValue('')
    setValidationError('')
  }, [])

  const handleSave = useCallback(async () => {
    const result = validatePrice(editValue)

    if (!result.valid) {
      setValidationError(result.error || 'Valor inválido')
      return
    }

    // Don't save if value hasn't changed
    if (configuredPrice && result.numericValue === configuredPrice.price) {
      setStatus('idle')
      return
    }

    setStatus('saving')
    setValidationError('')

    try {
      await upsertWashServicePrice(vehicleTypeId, washServiceId, result.numericValue!)
      setStatus('success')
      onPriceChange()

      // Clear success state after animation
      successTimeoutRef.current = setTimeout(() => {
        setStatus('idle')
      }, 1500)
    } catch (err: unknown) {
      let msg = 'Erro ao salvar preço'
      if (err && typeof err === 'object' && 'error' in err) {
        msg = (err as { error: string }).error
      } else if (err instanceof Error) {
        msg = err.message
      }
      setErrorMessage(msg)
      setStatus('error')

      // Clear error state after showing
      errorTimeoutRef.current = setTimeout(() => {
        setStatus('idle')
        setErrorMessage('')
      }, 3000)
    }
  }, [editValue, vehicleTypeId, washServiceId, configuredPrice, onPriceChange])

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!configuredPrice) return

    setStatus('saving')

    try {
      await deleteWashServicePrice(configuredPrice.id)
      setStatus('success')
      onPriceChange()

      successTimeoutRef.current = setTimeout(() => {
        setStatus('idle')
      }, 1500)
    } catch (err: unknown) {
      let msg = 'Erro ao remover preço'
      if (err && typeof err === 'object' && 'error' in err) {
        msg = (err as { error: string }).error
      } else if (err instanceof Error) {
        msg = err.message
      }
      setErrorMessage(msg)
      setStatus('error')

      errorTimeoutRef.current = setTimeout(() => {
        setStatus('idle')
        setErrorMessage('')
      }, 3000)
    }
  }, [configuredPrice, onPriceChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }, [handleSave, handleCancel])

  const handleBlur = useCallback(() => {
    // Small delay to allow button clicks to register
    setTimeout(() => {
      if (status === 'editing') {
        handleSave()
      }
    }, 150)
  }, [status, handleSave])

  // Editing mode
  if (status === 'editing') {
    return (
      <div className="price-cell-container price-cell-container--editing">
        <input
          ref={inputRef}
          type="text"
          className={`price-cell-input ${validationError ? 'price-cell-input--error' : ''}`}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value)
            if (validationError) setValidationError('')
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="0.00"
          aria-label="Editar preço"
        />
        {validationError && (
          <span className="price-cell-validation-error">{validationError}</span>
        )}
      </div>
    )
  }

  // Saving mode
  if (status === 'saving') {
    return (
      <div className="price-cell-container price-cell-container--saving">
        <span className="price-cell-saving-indicator">...</span>
      </div>
    )
  }

  // Success flash
  if (status === 'success') {
    return (
      <div className="price-cell-container price-cell-container--success" onClick={handleClick}>
        <span className="price-cell-value">{formatBRL(displayPrice)}</span>
        <span className="price-cell-success-icon">✓</span>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="price-cell-container price-cell-container--error" onClick={handleClick}>
        <span className="price-cell-value">{formatBRL(displayPrice)}</span>
        {errorMessage && <span className="price-cell-error-toast">{errorMessage}</span>}
      </div>
    )
  }

  // Idle state (default)
  return (
    <div
      className={`price-cell-container price-cell-container--idle ${isDefault ? 'price-cell-container--default' : ''}`}
      onClick={handleClick}
      title="Clique para editar"
    >
      <span className={`price-cell-value ${isDefault ? 'price-cell-value--default' : ''}`}>
        {formatBRL(displayPrice)}
      </span>
      {isDefault && <span className="price-cell-badge">(padrão)</span>}
      {!isDefault && (
        <button
          className="price-cell-remove-btn"
          onClick={handleDelete}
          title="Remover preço específico (usar padrão)"
          aria-label="Remover preço específico"
        >
          ×
        </button>
      )}
    </div>
  )
}
