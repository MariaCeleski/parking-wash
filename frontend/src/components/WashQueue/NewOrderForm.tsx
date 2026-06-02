import { useState, useEffect, useCallback } from 'react'
import { WashService, VehicleType } from '../../types/washOrders'
import { listWashServices } from '../../api/washServices'
import { createWashOrder } from '../../api/washOrders'
import { resolveWashServicePrice } from '../../api/washServicePrices'
import { apiGet } from '../../api/client'
import './NewOrderForm.css'

interface NewOrderFormProps {
  onSuccess?: () => void
  onOrderCreated?: () => void
}

const LEGACY_PLATE_REGEX = /^[A-Z]{3}-\d{4}$/
const MERCOSUL_PLATE_REGEX = /^[A-Z]{3}\d[A-Z]\d{2}$/

function isValidLicensePlate(plate: string): boolean {
  return LEGACY_PLATE_REGEX.test(plate) || MERCOSUL_PLATE_REGEX.test(plate)
}

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export function NewOrderForm({ onSuccess, onOrderCreated }: NewOrderFormProps): JSX.Element {
  const [licensePlate, setLicensePlate] = useState('')
  const [vehicleTypeId, setVehicleTypeId] = useState('')
  const [washServiceId, setWashServiceId] = useState('')
  const [services, setServices] = useState<WashService[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Price resolution state
  const [resolvedPrice, setResolvedPrice] = useState<number | null>(null)
  const [isDefaultPrice, setIsDefaultPrice] = useState(false)
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError, setPriceError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar serviços de lavagem
        const servicesData = await listWashServices()
        setServices(servicesData)
        if (servicesData.length > 0) {
          setWashServiceId(servicesData[0].id)
        }

        // Buscar tipos de veículo da API
        const vtData = await apiGet<VehicleType[]>('/api/vehicle-types')
        if (vtData && Array.isArray(vtData) && vtData.length > 0) {
          setVehicleTypes(vtData)
          // Default: selecionar "Carro" se existir, senão o primeiro
          const carType = vtData.find(vt => vt.code === 'CAR')
          setVehicleTypeId(carType ? carType.id : vtData[0].id)
        }
      } catch (err: unknown) {
        let errorMsg = 'Erro ao carregar dados'

        if (err instanceof Error) {
          errorMsg = err.message
        } else if (err && typeof err === 'object' && 'error' in err) {
          errorMsg = (err as { error: string }).error
        }

        setError(errorMsg)
      }
    }

    fetchData()
  }, [])

  // Fetch resolved price when vehicle type or wash service changes
  const fetchPrice = useCallback(async (vtId: string, wsId: string) => {
    if (!wsId) {
      setResolvedPrice(null)
      setPriceError(null)
      return
    }

    setPriceLoading(true)
    setPriceError(null)

    try {
      const result = await resolveWashServicePrice(vtId || null, wsId)
      setResolvedPrice(result.price)
      setIsDefaultPrice(result.isDefault)
    } catch {
      setResolvedPrice(null)
      setIsDefaultPrice(false)
      setPriceError('Preço indisponível')
    } finally {
      setPriceLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrice(vehicleTypeId, washServiceId)
  }, [vehicleTypeId, washServiceId, fetchPrice])

  const isPriceAvailable = resolvedPrice !== null && !priceError
  const isFormValid = isValidLicensePlate(licensePlate) && washServiceId && vehicleTypeId && isPriceAvailable

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      await createWashOrder(licensePlate, washServiceId, vehicleTypeId)
      setLicensePlate('')
      // Reset para Carro
      const carType = vehicleTypes.find(vt => vt.code === 'CAR')
      setVehicleTypeId(carType ? carType.id : vehicleTypes[0]?.id || '')
      setWashServiceId(services[0]?.id || '')
      onSuccess?.()
      onOrderCreated?.()
    } catch (err: unknown) {
      let errorMsg = 'Erro inesperado. Tente novamente.'

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

  return (
    <form onSubmit={handleSubmit} className="new-order-form">
      <h2>Nova Ordem de Lavagem</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="vehicleType">Tipo de Veículo</label>
        <select
          id="vehicleType"
          value={vehicleTypeId}
          onChange={(e) => setVehicleTypeId(e.target.value)}
        >
          {vehicleTypes.map((vt) => (
            <option key={vt.id} value={vt.id}>
              {vt.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="licensePlate">Placa do Veículo</label>
        <input
          id="licensePlate"
          type="text"
          placeholder="ABC-1234 ou ABC1D23"
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
        />
        {licensePlate && !isValidLicensePlate(licensePlate) && (
          <small style={{ color: '#c33' }}>Placa inválida</small>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="washService">Serviço de Lavagem</label>
        <select
          id="washService"
          value={washServiceId}
          onChange={(e) => setWashServiceId(e.target.value)}
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </div>

      <div className="price-display">
        {priceLoading && (
          <span className="price-loading">Consultando preço...</span>
        )}
        {priceError && (
          <span className="price-error">{priceError}</span>
        )}
        {isPriceAvailable && !priceLoading && (
          <span className="price-value">
            {formatBRL(resolvedPrice)}
            {isDefaultPrice && (
              <span className="price-default-label"> (preço padrão)</span>
            )}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={!isFormValid || loading}
        className="submit-button"
      >
        {loading ? 'Criando...' : 'Nova Ordem'}
      </button>
    </form>
  )
}
