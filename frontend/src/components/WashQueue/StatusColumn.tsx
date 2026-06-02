import { WashOrder, WashOrderStatus } from '../../types/washOrders'
import { WashOrderCard } from './WashOrderCard'
import './StatusColumn.css'

interface StatusColumnProps {
  status: WashOrderStatus
  orders: WashOrder[]
  onOrderUpdated: () => void
  onOrderCompleted?: (orderId: string) => void
}

const STATUS_LABELS: Record<WashOrderStatus, string> = {
  Waiting: 'Aguardando',
  InProgress: 'Em Progresso',
  Completed: 'Concluído',
}

const STATUS_COLORS: Record<WashOrderStatus, string> = {
  Waiting: '#ffc107',
  InProgress: '#17a2b8',
  Completed: '#28a745',
}

export function StatusColumn({ status, orders, onOrderUpdated, onOrderCompleted }: StatusColumnProps): JSX.Element {
  return (
    <div className="status-column">
      <h3 className="status-header" style={{ backgroundColor: STATUS_COLORS[status] }}>
        {STATUS_LABELS[status]} ({orders.length})
      </h3>

      {orders.length === 0 ? (
        <div className="empty-state">
          Nenhuma ordem
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <WashOrderCard
              key={order.id}
              order={order}
              onStatusUpdated={onOrderUpdated}
              onOrderCompleted={onOrderCompleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
