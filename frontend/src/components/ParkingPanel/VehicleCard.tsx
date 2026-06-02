import { ParkingRecord } from '../../types/parking'
import ElapsedTimer from './ElapsedTimer'
import './VehicleCard.css'

interface VehicleCardProps {
  record: ParkingRecord
  onCheckout: (record: ParkingRecord) => void
}

export default function VehicleCard({ record, onCheckout }: VehicleCardProps) {
  return (
    <div className="vehicle-card">
      <div className="vehicle-info">
        <h3 className="plate">{record.licensePlate}</h3>
        <div className="timer">
          <ElapsedTimer entryTime={record.entryTime} />
        </div>
      </div>
      <button
        className="checkout-button"
        onClick={() => onCheckout(record)}
      >
        Checkout
      </button>
    </div>
  )
}
