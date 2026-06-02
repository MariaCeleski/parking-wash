import { useState, useEffect } from 'react'
import { apiPost, apiPut } from '../../../api/client'
import type { VehicleType } from '../../../types/parking'

interface VehicleTypeFormProps {
  /** Vehicle type to edit. If null, form is in creation mode. */
  vehicleType?: VehicleType | null
  onSuccess: (vehicleType: VehicleType) => void
  onCancel: () => void
}

interface FormErrors {
  name?: string
  code?: string
  backend?: string
}

const CODE_REGEX = /^[A-Z0-9_]+$/

function validateName(name: string): string | undefined {
  const trimmed = name.trim()
  if (trimmed.length < 2) {
    return 'Nome deve ter no mínimo 2 caracteres'
  }
  if (trimmed.length > 50) {
    return 'Nome deve ter no máximo 50 caracteres'
  }
  return undefined
}

function validateCode(code: string): string | undefined {
  const trimmed = code.trim()
  if (trimmed.length < 2) {
    return 'Código deve ter no mínimo 2 caracteres'
  }
  if (trimmed.length > 20) {
    return 'Código deve ter no máximo 20 caracteres'
  }
  if (!CODE_REGEX.test(trimmed)) {
    return 'Código deve conter apenas letras maiúsculas, números e underscore'
  }
  return undefined
}

export function VehicleTypeForm({ vehicleType, onSuccess, onCancel }: VehicleTypeFormProps): JSX.Element {
  const isEditing = !!vehicleType

  const [name, setName] = useState(vehicleType?.name || '')
  const [code, setCode] = useState(vehicleType?.code || '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(vehicleType?.name || '')
    setCode(vehicleType?.code || '')
    setErrors({})
  }, [vehicleType])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    const nameError = validateName(name)
    if (nameError) {
      newErrors.name = nameError
    }

    if (!isEditing) {
      const codeError = validateCode(code)
      if (codeError) {
        newErrors.code = codeError
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setSaving(true)
    setErrors(prev => ({ ...prev, backend: undefined }))

    try {
      let result: VehicleType

      if (isEditing) {
        result = await apiPut<VehicleType>(`/api/vehicle-types/${vehicleType.id}`, {
          name: name.trim(),
        })
      } else {
        result = await apiPost<VehicleType>('/api/vehicle-types', {
          name: name.trim(),
          code: code.trim(),
        })
      }

      onSuccess(result)
    } catch (err: unknown) {
      let errorMsg = 'Erro inesperado. Tente novamente.'

      if (err && typeof err === 'object' && 'error' in err) {
        errorMsg = (err as { error: string }).error
      } else if (err instanceof Error) {
        errorMsg = err.message
      }

      setErrors(prev => ({ ...prev, backend: errorMsg }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="vehicle-type-form">
      <h3>{isEditing ? 'Editar Tipo de Veículo' : 'Novo Tipo de Veículo'}</h3>

      {errors.backend && (
        <div className="form-error-message">{errors.backend}</div>
      )}

      <div className="form-group">
        <label htmlFor="vt-name">Nome</label>
        <input
          id="vt-name"
          type="text"
          placeholder="Ex: Caminhonete"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) {
              setErrors(prev => ({ ...prev, name: undefined }))
            }
          }}
          maxLength={50}
        />
        {errors.name && <small className="field-error">{errors.name}</small>}
      </div>

      <div className="form-group">
        <label htmlFor="vt-code">Código</label>
        <input
          id="vt-code"
          type="text"
          placeholder="Ex: PICKUP"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            if (errors.code) {
              setErrors(prev => ({ ...prev, code: undefined }))
            }
          }}
          disabled={isEditing}
          maxLength={20}
        />
        {errors.code && <small className="field-error">{errors.code}</small>}
        {isEditing && (
          <small className="field-hint">Código não pode ser alterado após criação</small>
        )}
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="cancel-btn"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="submit-btn"
          disabled={saving}
        >
          {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}
