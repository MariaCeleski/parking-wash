import { useState, useEffect } from 'react'
import { getVehicleTypes } from '../../api/vehicleTypes'
import { listWashServices, updateWashServicePrice } from '../../api/washServices'
import { getSettings, updateSettings } from '../../api/settings'
import { apiPatch } from '../../api/client'
import type { VehicleType } from '../../types/parking'
import type { WashService } from '../../types/washOrders'
import './SettingsModal.css'

interface SettingsModalProps {
  onClose: () => void
  onSaved: () => void
}

export default function SettingsModal({ onClose, onSaved }: SettingsModalProps) {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [washServices, setWashServices] = useState<WashService[]>([])
  const [totalSpots, setTotalSpots] = useState(30)
  const [washSpots, setWashSpots] = useState(5)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Rates state
  const [rates, setRates] = useState<Record<string, { hourlyRate: number; dailyRate: number }>>({})
  const [washPrices, setWashPrices] = useState<Record<string, number>>({})

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [types, settings, services] = await Promise.all([
          getVehicleTypes(),
          getSettings(),
          listWashServices(),
        ])
        setVehicleTypes(types)
        setTotalSpots(settings.totalSpots)
        setWashSpots(settings.washSpots)
        setWashServices(services)

        const ratesMap: Record<string, { hourlyRate: number; dailyRate: number }> = {}
        for (const t of types) {
          ratesMap[t.id] = { hourlyRate: t.hourlyRate, dailyRate: t.dailyRate }
        }
        setRates(ratesMap)

        const pricesMap: Record<string, number> = {}
        for (const s of services) {
          pricesMap[s.id] = s.price
        }
        setWashPrices(pricesMap)
      } catch (err) {
        setError('Erro ao carregar configurações')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Save total spots and wash spots
      await updateSettings({ totalSpots, washSpots })

      // Save rates for each vehicle type
      for (const vt of vehicleTypes) {
        const newRates = rates[vt.id]
        if (newRates && (newRates.hourlyRate !== vt.hourlyRate || newRates.dailyRate !== vt.dailyRate)) {
          await apiPatch(`/api/vehicle-types/${vt.id}`, {
            hourlyRate: newRates.hourlyRate,
            dailyRate: newRates.dailyRate,
          })
        }
      }

      // Save wash service prices
      for (const ws of washServices) {
        const newPrice = washPrices[ws.id]
        if (newPrice !== undefined && newPrice !== ws.price) {
          await updateWashServicePrice(ws.id, newPrice)
        }
      }

      setSuccess('Configurações salvas com sucesso!')
      setTimeout(() => {
        onSaved()
        onClose()
      }, 1000)
    } catch (err: unknown) {
      let msg = 'Erro ao salvar'
      if (err && typeof err === 'object' && 'error' in err) {
        msg = (err as { error: string }).error
      }
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const updateRate = (id: string, field: 'hourlyRate' | 'dailyRate', value: number) => {
    setRates(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  if (loading) {
    return (
      <div className="settings-overlay" onClick={onClose}>
        <div className="settings-modal" onClick={e => e.stopPropagation()}>
          <div className="loading">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>⚙️ Configurações</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Total de vagas */}
        <section className="settings-section">
          <h3>🅿️ Vagas do Estacionamento</h3>
          <div className="form-row">
            <label htmlFor="totalSpots">Total de vagas de estacionamento</label>
            <input
              id="totalSpots"
              type="number"
              min={1}
              max={9999}
              value={totalSpots}
              onChange={e => setTotalSpots(parseInt(e.target.value, 10) || 1)}
            />
          </div>
          <div className="form-row" style={{ marginTop: '0.75rem' }}>
            <label htmlFor="washSpots">Total de vagas de lavagem</label>
            <input
              id="washSpots"
              type="number"
              min={1}
              max={999}
              value={washSpots}
              onChange={e => setWashSpots(parseInt(e.target.value, 10) || 1)}
            />
          </div>
        </section>

        {/* Tarifas por tipo */}
        <section className="settings-section">
          <h3>💰 Tarifas por Tipo de Veículo</h3>
          <p className="section-note">1ª hora = valor da tarifa horária. Frações de 30min = 50% da tarifa horária.</p>
          
          <div className="rates-grid">
            {vehicleTypes.map(vt => (
              <div key={vt.id} className="rate-card">
                <span className="rate-type-name">{vt.name}</span>
                <div className="rate-inputs">
                  <div className="rate-field">
                    <label>1ª Hora (R$)</label>
                    <input
                      type="number"
                      min={0.01}
                      step={0.5}
                      value={rates[vt.id]?.hourlyRate ?? vt.hourlyRate}
                      onChange={e => updateRate(vt.id, 'hourlyRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="rate-field">
                    <label>Diária (R$)</label>
                    <input
                      type="number"
                      min={0.01}
                      step={1}
                      value={rates[vt.id]?.dailyRate ?? vt.dailyRate}
                      onChange={e => updateRate(vt.id, 'dailyRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tarifas de lavagem */}
        <section className="settings-section">
          <h3>🚿 Tarifas de Lavagem</h3>
          <div className="rates-grid">
            {washServices.map(ws => (
              <div key={ws.id} className="rate-card">
                <span className="rate-type-name">{ws.name}</span>
                <div className="rate-inputs">
                  <div className="rate-field">
                    <label>Preço (R$)</label>
                    <input
                      type="number"
                      min={0.01}
                      step={1}
                      value={washPrices[ws.id] ?? ws.price}
                      onChange={e => setWashPrices(prev => ({ ...prev, [ws.id]: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {error && <div className="settings-error">{error}</div>}
        {success && <div className="settings-success">{success}</div>}

        <div className="settings-actions">
          <button className="cancel-btn" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </div>
  )
}
