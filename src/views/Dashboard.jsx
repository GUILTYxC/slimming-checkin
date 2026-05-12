import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { getPeriod, getPeriodActivities, getPeriodDayRecords } from '../db/database'
import {
  getEndDate, getTargetLoss, getActualLoss, getProgressPercent, getWeeklyTargetLoss,
  getWeekNumber, getAllWeeks, calculateActivityStats, calculateWeekStats,
} from '../utils/calculations'
import ProgressBar from '../components/ProgressBar'
import ActivityStats from '../components/ActivityStats'
import WeightChart from '../components/WeightChart'
import WeekProgress from '../components/WeekProgress'

export default function Dashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const periodId = parseInt(id)

  const period = useLiveQuery(() => getPeriod(periodId), [periodId])
  const activities = useLiveQuery(() => getPeriodActivities(periodId), [periodId]) || []
  const dayRecords = useLiveQuery(() => getPeriodDayRecords(periodId), [periodId]) || []

  if (!period) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-400">加载中...</p>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const currentWeek = getWeekNumber(period.startDate, today)
  const endDate = getEndDate(period.startDate, period.totalDays)

  const latestWeight = dayRecords
    .filter((r) => r.weight != null)
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.weight

  const targetLoss = getTargetLoss(period.initialWeight, period.targetWeight)
  const actualLoss = getActualLoss(period.initialWeight, latestWeight)
  const progress = getProgressPercent(period.initialWeight, period.targetWeight, latestWeight)
  const weeklyTarget = getWeeklyTargetLoss(period.initialWeight, period.targetWeight, period.totalDays)

  const activityStats = calculateActivityStats(activities, dayRecords)

  const chartData = dayRecords
    .filter((r) => r.weight != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({ date: r.date, weight: r.weight }))

  const allWeeks = getAllWeeks(period)
  const weekStatsMap = {}
  for (let i = 1; i <= allWeeks.length; i++) {
    weekStatsMap[i] = calculateWeekStats(period, dayRecords, i)
  }
  const weeksWithActual = allWeeks.map((w) => ({
    ...w,
    actual: weekStatsMap[w.weekNumber]?.actualLoss,
  }))

  const isActive = period.startDate <= today && today <= endDate

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-xl font-bold text-zinc-800 tracking-tight">{period.name}</h2>
        {isActive && (
          <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">进行中</span>
        )}
        <button
          onClick={() => navigate(`/period/${period.id}/edit`)}
          className="text-xs text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 px-2 py-1 rounded-lg transition-colors"
          title="编辑计划"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        {period.startDate} ~ {endDate} · {period.totalDays} 天 · {allWeeks.length} 周
      </p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: '需减体重', value: `${targetLoss} kg`, color: 'text-zinc-800' },
          { label: '已减体重', value: actualLoss > 0 ? `-${actualLoss} kg` : actualLoss === 0 ? '0 kg' : '--', color: actualLoss > 0 ? 'text-emerald-600' : 'text-zinc-400' },
          { label: '每周目标', value: `${weeklyTarget} kg`, color: 'text-zinc-700' },
          { label: '完成进度', value: `${progress}%`, color: 'text-brand-600' },
        ].map((item) => (
          <div key={item.label} className="card">
            <span className="stat-label">{item.label}</span>
            <p className={`stat-value ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="card mb-8">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-zinc-400">初始 {period.initialWeight} kg</span>
          <span className="text-zinc-400">目标 {period.targetWeight} kg</span>
        </div>
        <ProgressBar percent={progress} height="h-2.5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card">
            <h3 className="text-sm font-semibold text-zinc-700 mb-5">体重趋势</h3>
            <WeightChart data={chartData} targetWeight={period.targetWeight} initialWeight={period.initialWeight} />
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-zinc-700 mb-5">每周进展</h3>
            <WeekProgress weeks={weeksWithActual} currentWeek={currentWeek} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="card">
            <h3 className="text-sm font-semibold text-zinc-700 mb-5">活动完成率</h3>
            <ActivityStats stats={activityStats} />
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-zinc-700 mb-4">计划信息</h3>
            <div className="space-y-3 text-sm">
              {[
                ['开始日期', period.startDate],
                ['结束日期', endDate],
                ['总天数', `${period.totalDays} 天`],
                ['总周数', `${allWeeks.length} 周`],
                ['每日活动', `${activities.length} 项`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-zinc-400">{label}</span>
                  <span className="font-medium text-zinc-600">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
