import { useState, useCallback } from 'react'
import { getVehicleTypes } from '../../../api/vehicleTypes'
import { listWashServices } from '../../../api/washServices'
import { listWashServicePrices } from '../../../api/washServicePrices'
import { useAutoRefresh } from '../../../hooks/useAutoRefresh'
import PriceCell from './PriceCell'
import type { VehicleType } from '../../../types/parking'
import type { WashService } from '../../../types/washOrders'
import type { WashServicePriceResponse } from '../../../types/washServicePrices'
import './PriceGrid.css'

export default function PriceGrid() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [washServices, setWashServices] = useState<WashService[]>([])
  const [prices, setPrices] = useState<WashServicePriceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [typesData, servicesData, pricesData] = await Promise.all([
        getVehicleTypes(),
        listWashServices(),
        listWashServicePrices(),
      ])
      setVehicleTypes(typesData.filter((t) => t.isActive))
      setWashServices(servicesData)
      setPrices(pricesData)
      setError('')
    } catch (err: unknown) {
      let errorMsg = 'Erro ao carregar tabela de preços'
      if (err instanceof Error) errorMsg = err.message
      else if (err && typeof err === 'object' && 'error' in err) {
        errorMsg = (err as { error: string }).error
      }
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [])

  useAutoRefresh(fetchData, 30000)

  /**
   * Find the configured price for a vehicle type + wash service combination.
   * Returns the specific price if configured, or null to indicate fallback to default.
   */
  function getConfiguredPrice(
    vehicleTypeId: string,
    washServiceId: string
  ): WashServicePriceResponse | undefined {
    return prices.find(
      (p) => p.vehicleTypeId === vehicleTypeId && p.washServiceId === washServiceId
    )
  }

  if (loading && vehicleTypes.length === 0) {
    return (
      <div className="price-grid">
        <div className="price-grid-loading">
          <div className="price-grid-spinner" />
          <span className="price-grid-loading-text">Carregando tabela de preços...</span>
        </div>
      </div>
    )
  }

  if (error && vehicleTypes.length === 0) {
    return (
      <div className="price-grid">
        <div className="price-grid-error">
          <span className="price-grid-error-message">{error}</span>
          <button className="price-grid-retry-btn" onClick={fetchData}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (vehicleTypes.length === 0 || washServices.length === 0) {
    return (
      <div className="price-grid">
        <div className="price-grid-empty">
          {vehicleTypes.length === 0
            ? 'Nenhum tipo de veículo ativo cadastrado.'
            : 'Nenhum serviço de lavagem ativo cadastrado.'}
        </div>
      </div>
    )
  }

  return (
    <div className="price-grid">
      <div className="price-grid-header">
        <h3>💲 Tabela de Preços</h3>
      </div>

      <div className="price-grid-table-wrapper">
        <table className="price-grid-table">
          <thead>
            <tr>
              <th>Tipo de Veículo</th>
              {washServices.map((service) => (
                <th key={service.id}>{service.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehicleTypes.map((vehicleType) => (
              <tr key={vehicleType.id}>
                <td>{vehicleType.name}</td>
                {washServices.map((service) => {
                  const configured = getConfiguredPrice(vehicleType.id, service.id)

                  return (
                    <td key={service.id}>
                      <PriceCell
                        vehicleTypeId={vehicleType.id}
                        washServiceId={service.id}
                        configuredPrice={configured || null}
                        defaultPrice={service.price}
                        onPriceChange={fetchData}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
