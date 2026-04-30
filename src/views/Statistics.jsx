import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { getPeriod, getPeriodActivities, getPeriodDayRecords } from '../db/database'
import {
  getTargetLoss, getActualLoss, getProgressPercent, calculateActivityStats,
  calculateWeekStats, getAllWeeks,
} from '../utils/calculations'
import WeightChart from '../components/WeightChart'
import ActivityStats from '../components/ActivityStats'

export default function Statistics() {
  const { id } = useParams()
  const periodId = parseInt(id)

  const period = useLiveQuery(() => getPeriod(periodId), [periodId])
  const activities = useLiveQuery(() => getPeriodActivities(periodId), [periodId]) || []
  const dayRecords = useLiveQuery(() => getPeriodDayRecords(periodId), [periodId]) || []

  if (!period) {
    return <div className="flex items-center justify-center h-64"><p className="text-sm text-zinc-400">加载中...</p></div>
  }

  const latestWeight = dayRecords.filter((r) => r.weight != null)
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.weight

  const targetLoss = getTargetLoss(period.initialWeight, period.targetWeight)
  const actualLoss = getActualLoss(period.initialWeight, latestWeight)
  const progress = getProgressPercent(period.initialWeight, period.targetWeight, latestWeight)

  const chartData = dayRecords.filter((r) => r.weight != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({ date: r.date, weight: r.weight }))

  const activityStats = calculateActivityStats(activities, dayRecords)
  const allWeeks = getAllWeeks(period)

  const weekStatsList = allWeeks.map((w) => ({
    ...w, stats: calculateWeekStats(period, dayRecords, w.weekNumber),
  }))

  const totalCalories = dayRecords.reduce((sum, r) => sum + (r.caloriesBurned || 0), 0)
  const daysWithRecords = dayRecords.filter(
    (r) => r.weight != null || r.caloriesBurned != null ||
      Object.keys(r.activities || {}).length > 0
  ).length

  const today = new Date().toISOString().split('T')[0]
  const elapsedDays = Math.max(0, Math.min(period.totalDays,
    Math.floor((new Date(today) - new Date(period.startDate)) / (1000 * 60 * 60 * 24)) + 1))

  return (
    <div>
      <h2 className="text-xl font-bold text-zinc-800 tracking-tight mb-8">统计</h2>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: '减重进度', value: `${progress}%`, sub: `${actualLoss} / ${targetLoss} kg` },
          { label: '打卡天数', value: daysWithRecords, sub: `/ ${elapsedDays} 天` },
          { label: '总消耗', value: totalCalories.toLocaleString(), sub: 'kcal' },
          { label: '日均消耗', value: daysWithRecords > 0 ? Math.round(totalCalories / daysWithRecords).toLocaleString() : '--', sub: 'kcal/天' },
        ].map((item) => (
          <div key={item.label} className="card">
            <span className="stat-label">{item.label}</span>
            <p className="stat-value">{item.value}</p>
            <span className="text-[11px] text-zinc-400 mt-0.5">{item.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h3 className="text-sm font-semibold text-zinc-700 mb-5">体重趋势</h3>
          <WeightChart data={chartData} targetWeight={period.targetWeight} initialWeight={period.initialWeight} />
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-zinc-700 mb-5">活动完成率</h3>
          <ActivityStats stats={activityStats} />
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-zinc-700 mb-5">每周数据对比</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left py-3 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">周</th>
                <th className="text-left py-3 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">日期</th>
                <th className="text-center py-3 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">打卡</th>
                <th className="text-center py-3 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">均重</th>
                <th className="text-center py-3 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">消耗</th>
                <th className="text-center py-3 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">计划</th>
                <th className="text-center py-3 px-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">实际</th>
              </tr>
            </thead>
            <tbody>
              {weekStatsList.map((w) => {
                const s = w.stats
                const isCurrent = w.startDate <= today && today <= w.endDate
                return (
                  <tr key={w.weekNumber} className={`border-b border-zinc-50 ${isCurrent ? 'bg-zinc-50/50' : ''}`}>
                    <td className="py-3 px-3">
                      <span className="text-xs font-semibold w-5 h-5 rounded-full bg-zinc-100 text-zinc-500 inline-flex items-center justify-center">
                        {w.weekNumber}
                      </span>
                      {isCurrent && <span className="text-[10px] text-brand-500 ml-1.5">当前</span>}
                    </td>
                    <td className="py-3 px-3 text-xs text-zinc-400">{w.startDate} ~ {w.endDate}</td>
                    <td className="py-3 px-3 text-center font-medium text-zinc-700">{s.daysRecorded}</td>
                    <td className="py-3 px-3 text-center font-medium text-zinc-700">{s.avgWeight ?? '--'}</td>
                    <td className="py-3 px-3 text-center text-xs text-zinc-500">
                      {s.totalCalories > 0 ? s.totalCalories.toLocaleString() : '--'}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-zinc-600">{s.plannedLoss} kg</td>
                    <td className={`py-3 px-3 text-center font-medium ${
                      s.actualLoss != null
                        ? s.actualLoss >= s.plannedLoss ? 'text-emerald-600' : 'text-amber-500'
                        : 'text-zinc-300'
                    }`}>
                      {s.actualLoss != null ? `${s.actualLoss} kg` : '--'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
