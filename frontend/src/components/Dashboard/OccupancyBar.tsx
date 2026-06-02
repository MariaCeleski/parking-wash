import './OccupancyBar.css'

interface OccupancyBarProps {
  occupied: number
  total: number
}

export default function OccupancyBar({ occupied, total }: OccupancyBarProps) {
  const free = Math.max(0, total - occupied)
  const percentage = total > 0 ? Math.min(100, (occupied / total) * 100) : 0

  let statusClass = 'green'
  let statusLabel = 'Disponível'
  if (percentage >= 90) {
    statusClass = 'red'
    statusLabel = 'Quase lotado'
  } else if (percentage >= 70) {
    statusClass = 'yellow'
    statusLabel = 'Moderado'
  }

  if (free === 0) {
    statusLabel = 'LOTADO'
    statusClass = 'red'
  }

  return (
    <div className={`occupancy-bar-container ${statusClass}`}>
      <div className="occupancy-info">
        <span className="occupancy-label">🅿️ Vagas</span>
        <span className="occupancy-numbers">
          <strong>{free}</strong> livres / {total} total
        </span>
        <span className={`occupancy-status ${statusClass}`}>{statusLabel}</span>
      </div>
      <div className="occupancy-bar">
        <div
          className={`occupancy-fill ${statusClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="occupancy-detail">
        <span>{occupied} ocupadas</span>
        <span>{Math.round(percentage)}%</span>
      </div>
    </div>
  )
}
