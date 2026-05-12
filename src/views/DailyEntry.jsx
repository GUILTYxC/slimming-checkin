import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { getPeriod, getPeriodActivities, getPeriodDayRecords, saveDayRecord } from '../db/database'
import {
  getEndDate, getWeekNumber, getWeekDateRange, getWeightDiffFromPrev,
  getWeightDiffFromStart, getWeeklyTargetLoss, getDaysInWeek,
} from '../utils/calculations'
import DayRecordModal from '../components/DayRecordModal'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function DailyEntry() {
  const { id } = useParams()
  const periodId = parseInt(id)

  const period = useLiveQuery(() => getPeriod(periodId), [periodId])
  const activities = useLiveQuery(() => getPeriodActivities(periodId), [periodId]) || []
  const dayRecords = useLiveQuery(() => getPeriodDayRecords(periodId), [periodId]) || []

  const today = new Date().toISOString().split('T')[0]

  const [currentWeek, setCurrentWeek] = useState(1)
  const [selectedDate, setSelectedDate] = useState(null)
  const [initialized, setInitialized] = useState(false)
  const [saved, setSaved] = useState(false)
  const [weight, setWeight] = useState('')
  const [calories, setCalories] = useState('')
  const [checked, setChecked] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [modalDate, setModalDate] = useState(null)

  const totalWeeks = period ? Math.ceil(period.totalDays / 7) : 1
  const endDate = period ? getEndDate(period.startDate, period.totalDays) : ''

  useEffect(() => {
    if (period && !initialized) {
      const week = getWeekNumber(period.startDate, today)
      setCurrentWeek(week)
      if (today >= period.startDate && today <= getEndDate(period.startDate, period.totalDays)) {
        setSelectedDate(today)
      }
      setInitialized(true)
    }
  }, [period, today, initialized])
  const weekRange = period
    ? getWeekDateRange(period.startDate, currentWeek, period.totalDays)
    : { startDate: '', endDate: '' }
  const weekDays = period
    ? getDaysInWeek(period.startDate, currentWeek, period.totalDays)
    : []

  const recordsMap = useMemo(() => {
    const map = {}
    dayRecords.forEach((r) => { map[r.date] = r })
    return map
  }, [dayRecords])

  useEffect(() => {
    if (!selectedDate) return
    const r = recordsMap[selectedDate]
    if (r) {
      setWeight(r.weight != null ? String(r.weight) : '')
      setCalories(r.caloriesBurned != null ? String(r.caloriesBurned) : '')
      setChecked(r.activities || {})
    } else {
      setWeight(''); setCalories(''); setChecked({})
    }
  }, [selectedDate, recordsMap])

  useEffect(() => {
    if (saved) { const t = setTimeout(() => setSaved(false), 1500); return () => clearTimeout(t) }
  }, [saved])

  if (!period) {
    return <div className="flex items-center justify-center h-64"><p className="text-sm text-zinc-400">加载中...</p></div>
  }

  const getPrevWeight = (date) => {
    const d = new Date(date); d.setDate(d.getDate() - 1)
    return recordsMap[d.toISOString().split('T')[0]]?.weight ?? null
  }

  const prevWeight = selectedDate ? getPrevWeight(selectedDate) : null
  const currentWeightVal = weight ? parseFloat(weight) : null
  const diffFromPrev = getWeightDiffFromPrev(currentWeightVal, prevWeight)
  const diffFromStart = getWeightDiffFromStart(period.initialWeight, currentWeightVal)
  const weeklyTarget = getWeeklyTargetLoss(period.initialWeight, period.targetWeight, period.totalDays)

  const hasTodayRecord = recordsMap[today] != null

  const handleDateSelect = (date) => {
    if (date < period.startDate || date > endDate || date > today) return
    setSelectedDate(date)
    setModalDate(date)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setModalDate(null)
  }

  const handleModalSave = async (data) => {
    try {
      await saveDayRecord(data)
      setShowModal(false)
      setModalDate(null)
    } catch (err) {
      alert('保存失败：' + err.message)
    }
  }

  const handleSave = async () => {
    if (!selectedDate) return
    try {
      const existing = recordsMap[selectedDate]
      await saveDayRecord({
        id: existing?.id, periodId, date: selectedDate,
        weight: weight ? parseFloat(weight) : null,
        caloriesBurned: calories ? parseFloat(calories) : null,
        activities: checked,
      })
      setSaved(true)
    } catch (err) {
      alert('保存失败：' + err.message)
    }
  }

  const getDayHasData = (date) => {
    const r = recordsMap[date]
    if (!r) return false
    return r.weight != null || r.caloriesBurned != null ||
      (r.activities && Object.values(r.activities).some((v) => v))
  }

  const formatDateChinese = (dateStr) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日 星期${WEEKDAYS[d.getDay()]}`
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-zinc-800 tracking-tight mb-6">每日打卡</h2>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
            disabled={currentWeek === 1}
            className="btn-secondary text-xs py-1.5 px-3">
            ← 上周
          </button>
          <div className="text-center">
            <span className="text-sm font-semibold text-zinc-700">
              第 {currentWeek} / {totalWeeks} 周
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">{weekRange.startDate} ~ {weekRange.endDate}</p>
          </div>
          <button onClick={() => setCurrentWeek(Math.min(totalWeeks, currentWeek + 1))}
            disabled={currentWeek === totalWeeks}
            className="btn-secondary text-xs py-1.5 px-3">
            下周 →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] text-zinc-400 font-medium py-1">周{d}</div>
          ))}
          {weekDays.map((date) => {
            const d = new Date(date)
            const dayNum = d.getDate()
            const hasData = getDayHasData(date)
            const isSelected = selectedDate === date
            const isToday2 = date === today
            const isPast = date <= today
            const isInPeriod = date >= period.startDate && date <= endDate
            const canSelect = isInPeriod && isPast

            return (
              <button key={date} onClick={() => handleDateSelect(date)} disabled={!canSelect}
                className={`relative py-2 rounded-xl text-center transition-all duration-150 ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-200'
                    : canSelect
                    ? 'hover:bg-zinc-100'
                    : 'opacity-25 cursor-not-allowed'
                } ${isToday2 && !isSelected ? 'ring-2 ring-brand-200' : ''}`}
              >
                <div className={`text-[10px] ${isSelected ? 'text-brand-100' : 'text-zinc-400'}`}>
                  {WEEKDAYS[d.getDay()]}
                </div>
                <div className={`text-base font-semibold ${isSelected ? 'text-white' : 'text-zinc-700'}`}>
                  {dayNum}
                </div>
                {hasData && (
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-0.5 ${isSelected ? 'bg-white' : 'bg-brand-500'}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="card space-y-5">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-700">{formatDateChinese(selectedDate)}</h3>
            {selectedDate === today && (
              <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">今天</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="stat-label mb-1.5">今日体重 (kg)</label>
              <input type="number" className="input-field" step="0.1" placeholder="75.3"
                value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div>
              <label className="stat-label mb-1.5">运动消耗 (kcal)</label>
              <input type="number" className="input-field" step="10" placeholder="350"
                value={calories} onChange={(e) => setCalories(e.target.value)} />
            </div>
          </div>

          {activities.length > 0 && (
            <div>
              <label className="stat-label mb-2">今日活动</label>
              <div className="space-y-1.5">
                {activities.map((a) => (
                  <label key={a.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 ${
                      checked[a.id]
                        ? 'bg-emerald-50 border border-emerald-100'
                        : 'bg-zinc-50 hover:bg-zinc-100 border border-zinc-100'
                    }`}
                  >
                    <input type="checkbox" checked={!!checked[a.id]}
                      onChange={(e) => setChecked({ ...checked, [a.id]: e.target.checked })}
                      className="w-4 h-4 rounded accent-brand-600" />
                    <span className={`text-sm ${checked[a.id] ? 'text-emerald-700' : 'text-zinc-500'}`}>
                      {a.name}
                    </span>
                    {checked[a.id] && <span className="text-emerald-500 text-xs ml-auto">✓</span>}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="bg-zinc-50 rounded-2xl p-4 grid grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] text-zinc-400">与昨日比较</span>
              <p className={`text-sm font-semibold mt-0.5 ${
                diffFromPrev == null ? 'text-zinc-400' :
                diffFromPrev < 0 ? 'text-emerald-600' :
                diffFromPrev > 0 ? 'text-rose-500' : 'text-zinc-500'
              }`}>
                {diffFromPrev == null ? '--' :
                  `${diffFromPrev > 0 ? '+' : ''}${diffFromPrev.toFixed(1)} kg ${diffFromPrev < 0 ? '↓' : diffFromPrev > 0 ? '↑' : '→'}`}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400">与期初比较</span>
              <p className={`text-sm font-semibold mt-0.5 ${
                diffFromStart == null ? 'text-zinc-400' :
                diffFromStart > 0 ? 'text-emerald-600' :
                diffFromStart < 0 ? 'text-rose-500' : 'text-zinc-500'
              }`}>
                {diffFromStart == null ? '--' :
                  `-${diffFromStart.toFixed(1)} kg ↓`}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400">本周目标</span>
              <p className="text-sm font-semibold text-brand-600 mt-0.5">
                {weeklyTarget} kg / 周
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="btn-primary">保存</button>
            {saved && <span className="text-xs text-emerald-600 font-medium">✓ 已保存</span>}
          </div>
        </div>
      )}

      {showModal && modalDate && (
        <DayRecordModal
          date={modalDate}
          record={recordsMap[modalDate] || null}
          activities={activities}
          period={period}
          recordsMap={recordsMap}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  )
}
