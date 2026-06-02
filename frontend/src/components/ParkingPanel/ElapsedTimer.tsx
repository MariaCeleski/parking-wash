import { useElapsedTime } from '../../hooks/useElapsedTime'

interface ElapsedTimerProps {
  entryTime: string
}

export default function ElapsedTimer({ entryTime }: ElapsedTimerProps) {
  const elapsed = useElapsedTime(entryTime)

  return <span className="elapsed-timer">{elapsed}</span>
}
