import { useState, useEffect, useCallback } from 'react'
import { listParking, getHistory } from '../../api/parking'
import { getSettings } from '../../api/settings'
import { ParkingRecord } from '../../types/parking'
import CheckInForm from './CheckInForm'
import VehicleCard from './VehicleCard'
import CheckoutModal from './CheckoutModal'
import CurrentVehiclesPanel from './CurrentVehiclesPanel'
import OccupancyBar from '../Dashboard/OccupancyBar'
import './ParkingPanel.css'

interface ParkingPanelProps {
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void
}

function formatDuration(minutes: number): string {
  if (!minutes) return '—'
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

export default function ParkingPanel({ onToast }: ParkingPanelProps) {
  const [vehicles, setVehicles] = useState<ParkingRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<ParkingRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [totalSpots, setTotalSpots] = useState(30)
  const [showHistory, setShowHistory] = useState(false)
  const [historyRecords, setHistoryRecords] = useState<ParkingRecord[]>([])
  const [searchPlate, setSearchPlate] = useState('')
  const [historyOffset, setHistoryOffset] = useState(0)
  const [hasMoreHistory, setHasMoreHistory] = useState(true)
  const PAGE_SIZE = 20

  const fetchVehicles = async () => {
    setLoading(true)
    setError('')

    try {
      const [data, settings] = await Promise.all([
        listParking('Parked'),
        getSettings(),
      ])
      setVehicles(data)
      setTotalSpots(settings.totalSpots)
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

  const fetchHistory = useCallback(async (reset: boolean = true) => {
    try {
      const offset = reset ? 0 : historyOffset
      const data = await getHistory(PAGE_SIZE, offset)
      if (reset) {
        setHistoryRecords(data)
        setHistoryOffset(PAGE_SIZE)
      } else {
        setHistoryRecords(prev => [...prev, ...data])
        setHistoryOffset(prev => prev + PAGE_SIZE)
      }
      setHasMoreHistory(data.length === PAGE_SIZE)
    } catch (err) {
      console.error('Erro ao carregar histórico:', err)
    }
  }, [historyOffset])

  useEffect(() => {
    fetchVehicles()
    const interval = setInterval(fetchVehicles, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleCheckInSuccess = () => {
    fetchVehicles()
    onToast?.('Check-in realizado com sucesso!', 'success')
  }

  const handleToggleHistory = () => {
    if (!showHistory) {
      fetchHistory(true)
    }
    setShowHistory(!showHistory)
  }

  // Filter history by plate
  const filteredHistory = searchPlate
    ? historyRecords.filter(r =>
        r.licensePlate.replace(/-/g, '').includes(searchPlate.replace(/-/g, ''))
      )
    : historyRecords

  return (
    <div className="parking-panel">
      <div className="parking-panel-header">
        <h1>Estacionamento</h1>
        <button
          className={`history-toggle-btn ${showHistory ? 'active' : ''}`}
          onClick={handleToggleHistory}
        >
          {showHistory ? '← Voltar' : '📋 Histórico'}
        </button>
      </div>

      <OccupancyBar occupied={vehicles.length} total={totalSpots} />

      {!showHistory ? (
        <>
          <CheckInForm onSuccess={handleCheckInSuccess} />
          <CurrentVehiclesPanel />

          {error && <div className="error-message">{error}</div>}

          <div className="vehicles-section">
            <h2>Veículos Estacionados ({vehicles.length})</h2>

            {loading && <div className="loading">Carregando...</div>}

            {!loading && vehicles.length === 0 && (
              <div className="empty-state">
                <p>Nenhum veículo estacionado no momento</p>
              </div>
            )}

            {!loading && vehicles.length > 0 && (
              <div className="vehicles-list">
                {vehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    record={vehicle}
                    onCheckout={setSelectedRecord}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="parking-history">
          <h2>Histórico de Estacionamento</h2>
          <p className="history-subtitle">Últimos 10 checkouts realizados</p>

          <div className="history-search">
            <input
              type="text"
              placeholder="🔍 Buscar por placa (ex: ABC-1234)"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
              className="search-input"
            />
            {searchPlate && (
              <button className="clear-search-btn" onClick={() => setSearchPlate('')}>✕</button>
            )}
          </div>

          {searchPlate && (
            <p className="search-results-count">
              {filteredHistory.length} resultado{filteredHistory.length !== 1 ? 's' : ''} encontrado{filteredHistory.length !== 1 ? 's' : ''}
            </p>
          )}

          {filteredHistory.length === 0 ? (
            <div className="empty-history">
              {searchPlate
                ? `Nenhum registro encontrado para "${searchPlate}".`
                : 'Nenhum checkout realizado ainda.'}
            </div>
          ) : (
            <>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Entrada</th>
                    <th>Saída</th>
                    <th>Duração</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((record) => (
                    <tr key={record.id}>
                      <td className="plate-cell">{record.licensePlate}</td>
                      <td>{new Date(record.entryTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{record.exitTime ? new Date(record.exitTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td>{formatDuration(record.durationMinutes || 0)}</td>
                      <td className="price-cell">R$ {(record.totalAmount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {hasMoreHistory && !searchPlate && (
                <button className="load-more-btn" onClick={() => fetchHistory(false)}>
                  Carregar mais
                </button>
              )}
            </>
          )}
        </div>
      )}

      <CheckoutModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onSuccess={fetchVehicles}
        onToast={onToast}
      />
    </div>
  )
}
