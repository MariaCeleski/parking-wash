import { useState, useEffect, useCallback } from 'react'
import { apiGet } from '../../api/client'
import './NotificationBadge.css'

interface TimeWarning {
  parkingId: string
  licensePlate: string
  vehicleType: { name: string }
  durationMinutes: number
  timeLimit: number
  notificationType: 'warning' | 'critical'
  timestamp: string
}

export default function NotificationBadge() {
  const [notifications, setNotifications] = useState<TimeWarning[]>([])
  const [showPanel, setShowPanel] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiGet<TimeWarning[]>('/api/notifications')
      setNotifications(data)
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const count = notifications.length
  const hasCritical = notifications.some(n => n.notificationType === 'critical')

  if (count === 0) return null

  return (
    <div className="notification-badge-container">
      <button
        className={`notification-badge ${hasCritical ? 'critical' : 'warning'}`}
        onClick={() => setShowPanel(!showPanel)}
        title={`${count} alerta${count > 1 ? 's' : ''} de tempo`}
      >
        🔔
        <span className="badge-count">{count}</span>
      </button>

      {showPanel && (
        <div className="notification-panel">
          <div className="panel-header">
            <h3>⚠️ Alertas de Tempo</h3>
            <button className="close-panel" onClick={() => setShowPanel(false)}>✕</button>
          </div>
          <div className="panel-list">
            {notifications.map(n => (
              <div key={n.parkingId} className={`notification-item ${n.notificationType}`}>
                <div className="notif-icon">
                  {n.notificationType === 'critical' ? '🚨' : '⚠️'}
                </div>
                <div className="notif-content">
                  <span className="notif-plate">{n.licensePlate}</span>
                  <span className="notif-detail">
                    {n.vehicleType.name} • {Math.floor(n.durationMinutes / 60)}h {n.durationMinutes % 60}min
                  </span>
                  <span className="notif-status">
                    {n.notificationType === 'critical'
                      ? 'Excedeu o limite!'
                      : 'Próximo do limite'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
