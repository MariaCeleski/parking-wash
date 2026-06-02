import { useState, useEffect } from 'react'
import { listParking, getFipeData } from '../../api/parking'
import { getVehicleTypes } from '../../api/vehicleTypes'
import { ParkingRecord, VehicleType } from '../../types/parking'
import './CurrentVehiclesPanel.css'

interface VehicleWithInfo extends ParkingRecord {
  fipeData?: {
    brand: string
    model: string
    year: number
    fuel: string
    fipeValue: number
    vehicleType: string
  }
  vehicleTypeName?: string
  duration?: string
}

export default function CurrentVehiclesPanel() {
  const [vehicles, setVehicles] = useState<VehicleWithInfo[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const calculateDuration = (entryTime: string): string => {
    const entry = new Date(entryTime)
    const now = new Date()
    const diffMs = now.getTime() - entry.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 60) {
      return `${diffMins}m`
    }
    
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return `${hours}h ${mins}m`
  }

  const fetchVehicles = async () => {
    setLoading(true)
    setError('')

    try {
      const [data, types] = await Promise.all([
        listParking('Parked'),
        vehicleTypes.length === 0 ? getVehicleTypes() : Promise.resolve(vehicleTypes),
      ])

      if (types !== vehicleTypes) setVehicleTypes(types)

      // Map vehicle type names from the types list (no FIPE call needed)
      const vehiclesWithInfo: VehicleWithInfo[] = data.map(vehicle => {
        const vType = vehicle.vehicleTypeId
          ? types.find(t => t.id === vehicle.vehicleTypeId)
          : undefined
        return {
          ...vehicle,
          vehicleTypeName: vType?.name || 'Não informado',
          duration: calculateDuration(vehicle.entryTime),
        }
      })

      // Fetch FIPE data only for the first load (background, non-blocking)
      if (vehicles.length === 0) {
        setVehicles(vehiclesWithInfo)
        // Load FIPE in background
        Promise.all(
          vehiclesWithInfo.map(async (v) => {
            try {
              const fipeData = await getFipeData(v.licensePlate)
              return { ...v, fipeData }
            } catch {
              return v
            }
          })
        ).then(setVehicles)
      } else {
        // On refresh, just update durations and new vehicles
        setVehicles(vehiclesWithInfo)
      }
    } catch (err: unknown) {
      let errorMsg = 'Erro ao carregar veículos'
      
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

  // Atualizar duração a cada segundo
  useEffect(() => {
    fetchVehicles()
    
    const durationInterval = setInterval(() => {
      setVehicles(prev => 
        prev.map(v => ({
          ...v,
          duration: calculateDuration(v.entryTime),
        }))
      )
    }, 1000)

    // Recarregar lista a cada 30 segundos
    const fetchInterval = setInterval(fetchVehicles, 30000)

    return () => {
      clearInterval(durationInterval)
      clearInterval(fetchInterval)
    }
  }, [])

  return (
    <div className="current-vehicles-panel">
      <div className="panel-header">
        <h2>🚗 Veículos Estacionados Agora</h2>
        <span className="vehicle-count">{vehicles.length}</span>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && vehicles.length === 0 && (
        <div className="loading">Carregando veículos...</div>
      )}

      {!loading && vehicles.length === 0 && (
        <div className="empty-state">
          <p>✨ Nenhum veículo estacionado no momento</p>
        </div>
      )}

      {vehicles.length > 0 && (
        <div className="vehicles-grid">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-card">
              <div className="card-content">
                <div className="card-top">
                  <div className="plate-badge">{vehicle.licensePlate}</div>
                  <div className="duration-badge">{vehicle.duration}</div>
                </div>

                {vehicle.fipeData && (
                  <div className="fipe-info">
                    <div className="fipe-row">
                      <span className="label">Tipo:</span>
                      <span className="value">{vehicle.vehicleTypeName}</span>
                    </div>
                    <div className="fipe-row">
                      <span className="label">Marca:</span>
                      <span className="value">{vehicle.fipeData.brand}</span>
                    </div>
                    <div className="fipe-row">
                      <span className="label">Modelo:</span>
                      <span className="value">{vehicle.fipeData.model}</span>
                    </div>
                    <div className="fipe-row">
                      <span className="label">Ano:</span>
                      <span className="value">{vehicle.fipeData.year}</span>
                    </div>
                    <div className="fipe-row">
                      <span className="label">Combustível:</span>
                      <span className="value">{vehicle.fipeData.fuel}</span>
                    </div>
                    <div className="fipe-row highlight">
                      <span className="label">Valor FIPE:</span>
                      <span className="value">
                        R$ {vehicle.fipeData.fipeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                {!vehicle.fipeData && (
                  <div className="fipe-info">
                    <div className="fipe-row">
                      <span className="label">Tipo:</span>
                      <span className="value">{vehicle.vehicleTypeName}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <small>Entrada: {new Date(vehicle.entryTime).toLocaleTimeString('pt-BR')}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
