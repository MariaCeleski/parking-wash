import { useState, useCallback } from 'react'
import { getDashboard, type DashboardMetrics } from '../../api/parking'
import { getWashDashboard, type WashDashboardMetrics } from '../../api/washOrders'
import { getSettings, type ParkingSettings } from '../../api/settings'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { exportToCsv } from '../../utils/exportCsv'
import { formatBRL } from '../../utils/pricing'
import SettingsModal from './SettingsModal'
import PriceGrid from './PriceGrid/PriceGrid'
import VehicleTypeManager from './VehicleTypeManager/VehicleTypeManager'
import { VehicleTypeForm } from './VehicleTypeManager/VehicleTypeForm'
import type { VehicleType } from '../../types/parking'
import './Dashboard.css'

function formatDuration(minutes: number): string {
  if (minutes === 0) return '—'
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

type DashboardTab = 'overview' | 'prices' | 'vehicle-types'

export default function Dashboard() {
  const [parking, setParking] = useState<DashboardMetrics | null>(null)
  const [wash, setWash] = useState<WashDashboardMetrics | null>(null)
  const [settings, setSettings] = useState<ParkingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')

  // Vehicle Type Form state
  const [showVehicleTypeForm, setShowVehicleTypeForm] = useState(false)
  const [editingVehicleType, setEditingVehicleType] = useState<VehicleType | null>(null)
  const [vehicleTypeRefreshKey, setVehicleTypeRefreshKey] = useState(0)

  const handleExportCsv = () => {
    if (!parking || !wash) return
    const today = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')

    // Combine parking + wash data
    const rows: Record<string, any>[] = []

    // Parking checkouts
    parking.recentCheckouts.forEach(r => {
      rows.push({
        tipo: 'Estacionamento',
        placa: r.licensePlate,
        valor: r.totalAmount.toFixed(2),
        duracao: `${Math.floor(r.durationMinutes / 60)}h ${r.durationMinutes % 60}min`,
        hora: new Date(r.exitTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      })
    })

    // Wash completed
    wash.recentCompleted.forEach(r => {
      rows.push({
        tipo: 'Lavagem',
        placa: r.licensePlate,
        valor: r.price.toFixed(2),
        duracao: r.serviceName,
        hora: new Date(r.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      })
    })

    exportToCsv(`relatorio-${today}`, [
      { header: 'Tipo', key: 'tipo' },
      { header: 'Placa', key: 'placa' },
      { header: 'Valor (R$)', key: 'valor' },
      { header: 'Duração/Serviço', key: 'duracao' },
      { header: 'Hora', key: 'hora' },
    ], rows)
  }

  const fetchAll = useCallback(async () => {
    try {
      const [parkingData, washData, settingsData] = await Promise.all([
        getDashboard(),
        getWashDashboard(),
        getSettings(),
      ])
      setParking(parkingData)
      setWash(washData)
      setSettings(settingsData)
      setError('')
    } catch (err: unknown) {
      let errorMsg = 'Erro ao carregar métricas'
      if (err instanceof Error) errorMsg = err.message
      else if (err && typeof err === 'object' && 'error' in err) {
        errorMsg = (err as { error: string }).error
      }
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [])

  useAutoRefresh(fetchAll, 15000)

  const handleVehicleTypeEdit = (vehicleType: VehicleType) => {
    setEditingVehicleType(vehicleType)
    setShowVehicleTypeForm(true)
  }

  const handleVehicleTypeAdd = () => {
    setEditingVehicleType(null)
    setShowVehicleTypeForm(true)
  }

  const handleVehicleTypeFormSuccess = () => {
    setShowVehicleTypeForm(false)
    setEditingVehicleType(null)
    setVehicleTypeRefreshKey(prev => prev + 1)
  }

  const handleVehicleTypeFormCancel = () => {
    setShowVehicleTypeForm(false)
    setEditingVehicleType(null)
  }

  if (loading && !parking) {
    return <div className="dashboard"><div className="loading">Carregando métricas...</div></div>
  }

  if (error && !parking) {
    return <div className="dashboard"><div className="error-message">{error}</div></div>
  }

  if (!parking || !wash) return null

  const now = new Date()
  const todayLabel = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const totalRevenue = parking.revenueToday + wash.revenueToday
  const totalVehicles = parking.entriesTotal + wash.totalOrders

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h2>📊 Dashboard</h2>
        <div className="dashboard-header-right">
          <span className="dashboard-date">{todayLabel}</span>
          <button className="settings-btn" onClick={() => setShowSettings(true)}>⚙️ Configurações</button>
          <button className="export-btn" onClick={handleExportCsv}>📥 Exportar CSV</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Visão Geral
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'prices' ? 'active' : ''}`}
          onClick={() => setActiveTab('prices')}
        >
          💲 Preços por Serviço
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'vehicle-types' ? 'active' : ''}`}
          onClick={() => setActiveTab('vehicle-types')}
        >
          🚗 Tipos de Veículo
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Summary cards */}
          <div className="summary-cards">
            <div className="summary-card total-revenue">
              <span className="summary-icon">💰</span>
              <div className="summary-info">
                <span className="summary-label">Faturamento Total</span>
                <span className="summary-value">{formatBRL(totalRevenue)}</span>
              </div>
            </div>
            <div className="summary-card total-vehicles">
              <span className="summary-icon">🚗</span>
              <div className="summary-info">
                <span className="summary-label">Veículos Hoje</span>
                <span className="summary-value">{totalVehicles}</span>
              </div>
            </div>
            <div className="summary-card avg-duration">
              <span className="summary-icon">⏱️</span>
              <div className="summary-info">
                <span className="summary-label">Permanência Média</span>
                <span className="summary-value">{formatDuration(parking.avgDurationMinutes)}</span>
              </div>
            </div>
          </div>

          {/* Two-column sections */}
          <div className="dashboard-sections">
            {/* Estacionamento */}
            <div className="dashboard-section parking-section">
              <h3>🅿️ Estacionamento</h3>
              <div className="section-metrics">
                <div className="metric-row">
                  <span>Entradas hoje</span>
                  <strong>{parking.entriesTotal}</strong>
                </div>
                <div className="metric-row">
                  <span>Saídas hoje</span>
                  <strong>{parking.checkoutsToday}</strong>
                </div>
                <div className="metric-row">
                  <span>Ocupação atual</span>
                  <strong>{parking.currentOccupancy}/{settings?.totalSpots || 30}</strong>
                </div>
                <div className="metric-row highlight">
                  <span>Faturamento</span>
                  <strong>{formatBRL(parking.revenueToday)}</strong>
                </div>
                <div className="metric-row">
                  <span>Permanência média</span>
                  <strong>{formatDuration(parking.avgDurationMinutes)}</strong>
                </div>
              </div>

              <h4>Últimos Checkouts</h4>
              {parking.recentCheckouts.length === 0 ? (
                <p className="empty-table">Nenhum checkout hoje</p>
              ) : (
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Duração</th>
                      <th>Valor</th>
                      <th>Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parking.recentCheckouts.map(r => (
                      <tr key={r.id}>
                        <td className="plate">{r.licensePlate}</td>
                        <td>{formatDuration(r.durationMinutes)}</td>
                        <td className="amount">{formatBRL(r.totalAmount)}</td>
                        <td>{formatTime(r.exitTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Lavagem */}
            <div className="dashboard-section wash-section">
              <h3>🚿 Lavagem</h3>
              <div className="section-metrics">
                <div className="metric-row">
                  <span>Ordens hoje</span>
                  <strong>{wash.totalOrders}</strong>
                </div>
                <div className="metric-row">
                  <span>Concluídas</span>
                  <strong>{wash.completedToday}</strong>
                </div>
                <div className="metric-row">
                  <span>Em andamento</span>
                  <strong>{wash.inProgress}</strong>
                </div>
                <div className="metric-row">
                  <span>Aguardando</span>
                  <strong>{wash.waiting}</strong>
                </div>
                <div className="metric-row highlight">
                  <span>Faturamento</span>
                  <strong>{formatBRL(wash.revenueToday)}</strong>
                </div>
              </div>

              <h4>Últimas Lavagens</h4>
              {wash.recentCompleted.length === 0 ? (
                <p className="empty-table">Nenhuma lavagem concluída hoje</p>
              ) : (
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Serviço</th>
                      <th>Valor</th>
                      <th>Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wash.recentCompleted.map(r => (
                      <tr key={r.id}>
                        <td className="plate">{r.licensePlate}</td>
                        <td>{r.serviceName}</td>
                        <td className="amount">{formatBRL(r.price)}</td>
                        <td>{formatTime(r.completedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'prices' && (
        <div className="dashboard-tab-content">
          <PriceGrid />
        </div>
      )}

      {activeTab === 'vehicle-types' && (
        <div className="dashboard-tab-content">
          {showVehicleTypeForm ? (
            <VehicleTypeForm
              vehicleType={editingVehicleType}
              onSuccess={handleVehicleTypeFormSuccess}
              onCancel={handleVehicleTypeFormCancel}
            />
          ) : (
            <VehicleTypeManager
              onEdit={handleVehicleTypeEdit}
              onAdd={handleVehicleTypeAdd}
              refreshKey={vehicleTypeRefreshKey}
            />
          )}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSaved={() => fetchAll()}
        />
      )}
    </div>
  )
}
