import { useState, useEffect } from 'react'
import { VehicleType } from '../../types/parking'
import { apiGet } from '../../api/client'
import './VehicleTypeSelector.css'

interface VehicleTypeSelectorProps {
  value: string | undefined
  onChange: (vehicleTypeId: string | undefined) => void
  disabled?: boolean
}

const FALLBACK_VEHICLE_TYPES: VehicleType[] = [
  {
    id: '1',
    name: 'Motocicleta',
    code: 'MOTORCYCLE',
    hourlyRate: 5.00,
    dailyRate: 30.00,
    isActive: true,
  },
  {
    id: '2',
    name: 'Carro',
    code: 'CAR',
    hourlyRate: 10.00,
    dailyRate: 60.00,
    isActive: true,
  },
  {
    id: '3',
    name: 'Motorhome',
    code: 'MOTORHOME',
    hourlyRate: 20.00,
    dailyRate: 120.00,
    isActive: true,
  },
]

export function VehicleTypeSelector({ value, onChange, disabled }: VehicleTypeSelectorProps) {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(FALLBACK_VEHICLE_TYPES)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchVehicleTypes = async () => {
      setLoading(true)
      try {
        const response = await apiGet<VehicleType[]>('/api/vehicle-types')
        if (response && Array.isArray(response) && response.length > 0) {
          setVehicleTypes(response)
        }
      } catch (err) {
        console.warn('Failed to fetch vehicle types, using fallback')
      } finally {
        setLoading(false)
      }
    }

    fetchVehicleTypes()
  }, [])

  const selectedVehicle = vehicleTypes.find(vt => vt.id === value)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      onChange(e.target.value || undefined)
    } catch (err) {
      console.error('Error in onChange:', err)
    }
  }

  return (
    <div className="vehicle-type-selector">
      <label htmlFor="vehicle-type">Tipo de Veículo</label>
      
      <select
        id="vehicle-type"
        value={value || ''}
        onChange={handleChange}
        disabled={disabled || loading}
        className="vehicle-type-select"
      >
        <option value="">Selecione um tipo de veículo</option>
        {vehicleTypes && vehicleTypes.map((vt) => (
          <option key={vt.id} value={vt.id}>
            {vt.name}
          </option>
        ))}
      </select>

      {selectedVehicle && selectedVehicle.hourlyRate && selectedVehicle.dailyRate && (
        <div className="vehicle-type-info">
          <div className="tariff-row">
            <span className="tariff-label">Taxa Horária:</span>
            <span className="tariff-value">R$ {Number(selectedVehicle.hourlyRate).toFixed(2)}/h</span>
          </div>
          <div className="tariff-row">
            <span className="tariff-label">Taxa Diária:</span>
            <span className="tariff-value">R$ {Number(selectedVehicle.dailyRate).toFixed(2)}/dia</span>
          </div>
        </div>
      )}
    </div>
  )
}
