import { Navigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { getAllPeriods, getDayRecord } from '../db/database'
import { getEndDate } from '../utils/calculations'
import PeriodList from './PeriodList'

export default function Home() {
  const periods = useLiveQuery(() => getAllPeriods(), []) || []
  const today = new Date().toISOString().split('T')[0]

  const activePeriod = periods.find((p) => {
    const end = getEndDate(p.startDate, p.totalDays)
    return p.startDate <= today && today <= end
  })

  const hasTodayRecord = useLiveQuery(
    () => (activePeriod ? getDayRecord(activePeriod.id, today) : null),
    [activePeriod?.id, today]
  )

  if (activePeriod) {
    if (hasTodayRecord) {
      return <Navigate to={`/period/${activePeriod.id}`} replace />
    }
    return <Navigate to={`/period/${activePeriod.id}/daily`} replace />
  }

  return <PeriodList />
}
