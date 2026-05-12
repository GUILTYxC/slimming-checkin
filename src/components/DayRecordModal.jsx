import { useState, useEffect } from 'react'
import { getWeightDiffFromPrev, getWeightDiffFromStart } from '../utils/calculations'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function DayRecordModal({ date, record, activities, period, recordsMap, onClose, onSave }) {
  const today = new Date().toISOString().split('T')[0]
  const isToday = date === today

  const [isEditing, setIsEditing] = useState(false)
  const [weight, setWeight] = useState('')
  const [calories, setCalories] = useState('')
  const [checked, setChecked] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (record) {
      setWeight(record.weight != null ? String(record.weight) : '')
      setCalories(record.caloriesBurned != null ? String(record.caloriesBurned) : '')
      setChecked(record.activities || {})
    } else {
      setWeight('')
      setCalories('')
      setChecked({})
    }
  }, [record])

  const getPrevWeight = () => {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    return recordsMap[d.toISOString().split('T')[0]]?.weight ?? null
  }

  const prevWeight = getPrevWeight()
  const currentWeightVal = weight ? parseFloat(weight) : null
  const diffFromPrev = getWeightDiffFromPrev(currentWeightVal, prevWeight)
  const diffFromStart = getWeightDiffFromStart(period.initialWeight, currentWeightVal)

  const hasData = record && (
    record.weight != null ||
    record.caloriesBurned != null ||
    (record.activities && Object.values(record.activities).some((v) => v))
  )

  const formatDateChinese = (dateStr) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日 星期${WEEKDAYS[d.getDay()]}`
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        id: record?.id,
        periodId: period.id,
        date,
        weight: weight ? parseFloat(weight) : null,
        caloriesBurned: calories ? parseFloat(calories) : null,
        activities: checked,
      })
    } catch (err) {
      alert('保存失败：' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-zinc-800">{formatDateChinese(date)}</h3>
            {isToday && (
              <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">
                今天
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {isEditing ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="stat-label mb-1.5">今日体重 (kg)</label>
                  <input
                    type="number"
                    className="input-field"
                    step="0.1"
                    placeholder="75.3"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div>
                  <label className="stat-label mb-1.5">运动消耗 (kcal)</label>
                  <input
                    type="number"
                    className="input-field"
                    step="10"
                    placeholder="350"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                  />
                </div>
              </div>

              {activities.length > 0 && (
                <div>
                  <label className="stat-label mb-2">今日活动</label>
                  <div className="space-y-1.5">
                    {activities.map((a) => (
                      <label
                        key={a.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 ${
                          checked[a.id]
                            ? 'bg-emerald-50 border border-emerald-100'
                            : 'bg-zinc-50 hover:bg-zinc-100 border border-zinc-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!checked[a.id]}
                          onChange={(e) => setChecked({ ...checked, [a.id]: e.target.checked })}
                          className="w-4 h-4 rounded accent-brand-600"
                        />
                        <span className={`text-sm ${checked[a.id] ? 'text-emerald-700' : 'text-zinc-500'}`}>
                          {a.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {hasData ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 rounded-xl p-4">
                      <span className="text-[10px] text-zinc-400">今日体重</span>
                      <p className="text-xl font-semibold text-zinc-800 mt-1">
                        {record.weight != null ? `${record.weight} kg` : '--'}
                      </p>
                    </div>
                    <div className="bg-zinc-50 rounded-xl p-4">
                      <span className="text-[10px] text-zinc-400">运动消耗</span>
                      <p className="text-xl font-semibold text-zinc-800 mt-1">
                        {record.caloriesBurned != null ? `${record.caloriesBurned} kcal` : '--'}
                      </p>
                    </div>
                  </div>

                  {activities.length > 0 && (
                    <div>
                      <span className="text-[10px] text-zinc-400 font-medium">今日活动</span>
                      <div className="mt-2 space-y-1.5">
                        {activities.map((a) => {
                          const completed = record.activities?.[a.id]
                          return (
                            <div
                              key={a.id}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                                completed
                                  ? 'bg-emerald-50 border border-emerald-100'
                                  : 'bg-zinc-50 border border-zinc-100'
                              }`}
                            >
                              <span className={`text-sm ${completed ? 'text-emerald-700' : 'text-zinc-400'}`}>
                                {completed ? '✓' : '○'}
                              </span>
                              <span className={`text-sm ${completed ? 'text-emerald-700' : 'text-zinc-500'}`}>
                                {a.name}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="bg-zinc-50 rounded-2xl p-4 grid grid-cols-2 gap-4">
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
                          `${diffFromStart > 0 ? '-' : '+'}${Math.abs(diffFromStart).toFixed(1)} kg ${diffFromStart > 0 ? '↓' : diffFromStart < 0 ? '↑' : '→'}`}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-zinc-400 text-sm">当日暂无打卡记录</p>
                  <p className="text-zinc-300 text-xs mt-1">点击编辑按钮添加记录</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-zinc-100">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              编辑
            </button>
          )}
        </div>
      </div>
    </div>
  )
}