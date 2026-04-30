import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { addPeriod, addDailyActivity, getAllPeriods } from '../db/database'
import { getEndDate, getTargetLoss, getWeeklyTargetLoss, getTotalWeeks } from '../utils/calculations'

export default function PeriodForm() {
  const navigate = useNavigate()
  const periods = useLiveQuery(() => getAllPeriods(), []) || []
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    name: '', startDate: today, totalDays: 30, initialWeight: '', targetWeight: '',
  })
  const [activities, setActivities] = useState([])
  const [newActivity, setNewActivity] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const hasActive = periods.some((p) => {
      const end = getEndDate(p.startDate, p.totalDays)
      return p.startDate <= today && today <= end
    })
    if (hasActive) setError('当前有进行中的减重期')
  }, [periods, today])

  const targetLoss =
    form.initialWeight && form.targetWeight
      ? getTargetLoss(parseFloat(form.initialWeight), parseFloat(form.targetWeight)) : null
  const weeklyLoss = targetLoss != null && targetLoss > 0
    ? getWeeklyTargetLoss(parseFloat(form.initialWeight), parseFloat(form.targetWeight), form.totalDays) : null
  const totalWeeks = getTotalWeeks(form.totalDays)
  const endDate = getEndDate(form.startDate, form.totalDays)

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (!form.name.trim()) { setError('请输入计划名称'); return }
    if (!form.initialWeight || parseFloat(form.initialWeight) <= 0) { setError('请输入有效的初始体重'); return }
    if (!form.targetWeight || parseFloat(form.targetWeight) <= 0) { setError('请输入有效的目标体重'); return }
    if (parseFloat(form.targetWeight) >= parseFloat(form.initialWeight)) { setError('目标体重必须小于初始体重'); return }
    if (form.totalDays < 7) { setError('减重天数至少为 7 天'); return }
    if (activities.length === 0) { setError('请至少添加一个每日活动'); return }

    setSaving(true)
    try {
      const periodId = await addPeriod({
        name: form.name.trim(), startDate: form.startDate,
        totalDays: form.totalDays, initialWeight: parseFloat(form.initialWeight),
        targetWeight: parseFloat(form.targetWeight),
      })
      for (const activity of activities) {
        await addDailyActivity({ periodId, name: activity.trim() })
      }
      navigate(`/period/${periodId}`)
    } catch (err) {
      setError('保存失败：' + err.message)
      setSaving(false)
    }
  }

  const addActivity = () => {
    const name = newActivity.trim()
    if (!name) return
    if (activities.includes(name)) { setError('活动名称不能重复'); return }
    setActivities([...activities, name])
    setNewActivity('')
  }

  return (
    <div className="max-w-xl">
      <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-600 mb-6 transition-colors">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        返回
      </button>

      <h2 className="text-xl font-bold text-zinc-800 tracking-tight mb-2">创建减重计划</h2>
      <p className="text-sm text-zinc-400 mb-8">设置你的目标和每日活动</p>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">计划名称</label>
            <input type="text" className="input-field" placeholder="如：春季减重计划"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">开始日期</label>
              <input type="date" className="input-field" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">减重天数</label>
              <input type="number" className="input-field" min="7"
                value={form.totalDays} onChange={(e) => setForm({ ...form, totalDays: parseInt(e.target.value) || 7 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">初始体重 (kg)</label>
              <input type="number" className="input-field" step="0.1" placeholder="80.0"
                value={form.initialWeight} onChange={(e) => setForm({ ...form, initialWeight: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">目标体重 (kg)</label>
              <input type="number" className="input-field" step="0.1" placeholder="70.0"
                value={form.targetWeight} onChange={(e) => setForm({ ...form, targetWeight: e.target.value })} />
            </div>
          </div>
        </div>

        {targetLoss != null && targetLoss > 0 && (
          <div className="card bg-brand-50/30 border-brand-100">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: '需减体重', value: `${targetLoss} kg` },
                { label: '总共周数', value: `${totalWeeks} 周` },
                { label: '每周目标', value: `${weeklyLoss} kg` },
                { label: '结束日期', value: endDate },
              ].map((item) => (
                <div key={item.label}>
                  <span className="text-[10px] text-brand-400 uppercase tracking-wider">{item.label}</span>
                  <p className="text-base font-semibold text-brand-700 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card space-y-4">
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">每日活动</label>
          <div className="flex gap-2">
            <input type="text" className="input-field flex-1" placeholder="如：跑步 30 分钟"
              value={newActivity} onChange={(e) => setNewActivity(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addActivity() } }} />
            <button type="button" onClick={addActivity} className="btn-secondary">添加</button>
          </div>
          {activities.length > 0 && (
            <div className="space-y-1.5">
              {activities.map((a, i) => (
                <div key={i} className="flex items-center justify-between bg-zinc-50 px-4 py-2.5 rounded-xl">
                  <span className="text-sm text-zinc-600">{a}</span>
                  <button type="button" onClick={() => setActivities(activities.filter((_, idx) => idx !== i))}
                    className="text-zinc-300 hover:text-rose-500 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full py-3 text-sm">
          {saving ? '创建中...' : '创建减重计划'}
        </button>
      </form>
    </div>
  )
}
