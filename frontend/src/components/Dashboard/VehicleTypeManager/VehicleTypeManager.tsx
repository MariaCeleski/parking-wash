import { useState, useEffect, useCallback } from 'react'
import { getAllVehicleTypes, toggleVehicleTypeActive } from '../../../api/vehicleTypes'
import type { VehicleType } from '../../../types/parking'
import './VehicleTypeManager.css'

interface VehicleTypeManagerProps {
  onEdit: (vehicleType: VehicleType) => void
  onAdd: () => void
  refreshKey?: number
}

export default function VehicleTypeManager({ onEdit, onAdd, refreshKey }: VehicleTypeManagerProps) {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchVehicleTypes = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllVehicleTypes()
      setVehicleTypes(data)
      setError('')
    } catch (err: unknown) {
      let msg = 'Erro ao carregar tipos de veículo'
      if (err && typeof err === 'object' && 'error' in err) {
        msg = (err as { error: string }).error
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVehicleTypes()
  }, [fetchVehicleTypes, refreshKey])

  const handleToggleActive = async (id: string) => {
    setTogglingId(id)
    try {
      const updated = await toggleVehicleTypeActive(id)
      setVehicleTypes(prev =>
        prev.map(vt => (vt.id === updated.id ? updated : vt))
      )
      setError('')
    } catch (err: unknown) {
      let msg = 'Erro ao alterar status'
      if (err && typeof err === 'object' && 'error' in err) {
        msg = (err as { error: string }).error
      }
      setError(msg)
    } finally {
      setTogglingId(null)
    }
  }

  if (loading && vehicleTypes.length === 0) {
    return (
      <div className="vehicle-type-manager">
        <div className="vtm-loading">Carregando tipos de veículo...</div>
      </div>
    )
  }

  if (error && vehicleTypes.length === 0) {
    return (
      <div className="vehicle-type-manager">
        <div className="vtm-error">
          <span>{error}</span>
          <button className="vtm-retry-btn" onClick={fetchVehicleTypes}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="vehicle-type-manager">
      <div className="vtm-header">
        <h3>🚗 Tipos de Veículo</h3>
        <button className="vtm-add-btn" onClick={onAdd}>
          + Novo Tipo
        </button>
      </div>

      {error && (
        <div className="vtm-error-inline">{error}</div>
      )}

      <table className="vtm-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Código</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {vehicleTypes.map(vt => (
            <tr key={vt.id} className={!vt.isActive ? 'vtm-row-inactive' : ''}>
              <td className="vtm-name">{vt.name}</td>
              <td className="vtm-code">{vt.code}</td>
              <td>
                <span className={`vtm-status-badge ${vt.isActive ? 'vtm-active' : 'vtm-inactive'}`}>
                  {vt.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="vtm-actions">
                <button
                  className="vtm-edit-btn"
                  onClick={() => onEdit(vt)}
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  className={`vtm-toggle-btn ${vt.isActive ? 'vtm-deactivate' : 'vtm-activate'}`}
                  onClick={() => handleToggleActive(vt.id)}
                  disabled={togglingId === vt.id}
                  title={vt.isActive ? 'Desativar' : 'Ativar'}
                >
                  {togglingId === vt.id
                    ? '...'
                    : vt.isActive
                      ? 'Desativar'
                      : 'Ativar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {vehicleTypes.length === 0 && (
        <p className="vtm-empty">Nenhum tipo de veículo cadastrado.</p>
      )}
    </div>
  )
}
