import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { getPeriod, getPeriodDayRecords, getPeriodWeeklySummaries, saveWeeklySummary } from '../db/database'
import { getAllWeeks, calculateWeekStats } from '../utils/calculations'

export default function WeeklySummary() {
  const { id } = useParams()
  const periodId = parseInt(id)

  const period = useLiveQuery(() => getPeriod(periodId), [periodId])
  const dayRecords = useLiveQuery(() => getPeriodDayRecords(periodId), [periodId]) || []
  const summaries = useLiveQuery(() => getPeriodWeeklySummaries(periodId), [periodId]) || []

  const [editingWeek, setEditingWeek] = useState(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)

  if (!period) {
    return <div className="flex items-center justify-center h-64"><p className="text-sm text-zinc-400">加载中...</p></div>
  }

  const allWeeks = getAllWeeks(period)
  const today = new Date().toISOString().split('T')[0]
  const summaryMap = {}
  summaries.forEach((s) => { summaryMap[s.weekNumber] = s })

  const startEdit = (week) => {
    setEditingWeek(week.weekNumber)
    setEditText(summaryMap[week.weekNumber]?.summary || '')
  }

  const handleSave = async (weekNumber) => {
    if (!editText.trim()) return
    setSaving(true)
    try {
      const existing = summaryMap[weekNumber]
      const range = allWeeks.find((w) => w.weekNumber === weekNumber)
      await saveWeeklySummary({
        id: existing?.id, periodId, weekNumber,
        startDate: range.startDate, endDate: range.endDate,
        summary: editText.trim(),
      })
      setEditingWeek(null)
    } catch (err) {
      alert('保存失败：' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-zinc-800 tracking-tight mb-8">周总结</h2>

      <div className="space-y-4">
        {allWeeks.map((week) => {
          const stats = calculateWeekStats(period, dayRecords, week.weekNumber)
          const summary = summaryMap[week.weekNumber]
          const isEditing = editingWeek === week.weekNumber
          const hasWritten = summary?.summary
          const onTarget = stats.actualLoss != null && stats.actualLoss >= stats.plannedLoss

          return (
            <div key={week.weekNumber} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-xs font-semibold w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center">
                      {week.weekNumber}
                    </span>
                    <h3 className="font-semibold text-zinc-700 text-sm">
                      第 {week.weekNumber} 周
                      <span className="text-xs text-zinc-400 font-normal ml-2">
                        {week.startDate} ~ {week.endDate}
                      </span>
                    </h3>
                  </div>

                  <div className="flex gap-5 text-xs">
                    <span className="text-zinc-400">
                      计划减重 <strong className="text-brand-600">{stats.plannedLoss} kg</strong>
                    </span>
                    {stats.actualLoss != null && (
                      <span className={onTarget ? 'text-emerald-600' : 'text-amber-500'}>
                        实际减重 <strong>{stats.actualLoss} kg</strong>
                      </span>
                    )}
                    <span className="text-zinc-400">
                      打卡 <strong className="text-zinc-600">{stats.daysRecorded}</strong>/7 天
                    </span>
                    {stats.avgWeight != null && (
                      <span className="text-zinc-400">
                        平均 <strong className="text-zinc-600">{stats.avgWeight} kg</strong>
                      </span>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <button onClick={() => startEdit(week)}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors">
                    {hasWritten ? '编辑' : '写总结'}
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <textarea className="input-field h-24 resize-none text-sm"
                    placeholder="记录本周心得、遇到的困难、下周计划..."
                    value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(week.weekNumber)}
                      disabled={!editText.trim() || saving}
                      className="btn-primary text-xs py-1.5">
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button onClick={() => setEditingWeek(null)} className="btn-secondary text-xs py-1.5">取消</button>
                  </div>
                </div>
              ) : hasWritten ? (
                <p className="text-sm text-zinc-600 bg-zinc-50 p-4 rounded-2xl whitespace-pre-wrap leading-relaxed">
                  {summary.summary}
                </p>
              ) : (
                <p className="text-xs text-zinc-300 italic">还没写总结...</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
