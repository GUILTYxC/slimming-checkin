import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import db, { getAllPeriods, deletePeriod } from '../db/database'
import { getEndDate, getTargetLoss, getProgressPercent, getActualLoss } from '../utils/calculations'

export default function PeriodList() {
  const navigate = useNavigate()
  const periods = useLiveQuery(() => getAllPeriods(), []) || []
  const [activePeriodId, setActivePeriodId] = useState(null)
  const [weights, setWeights] = useState({})

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const active = periods.find((p) => {
      const end = getEndDate(p.startDate, p.totalDays)
      return p.startDate <= today && today <= end
    })
    setActivePeriodId(active?.id || null)

    periods.forEach((p) => {
      db.dayRecords
        .where('periodId').equals(p.id)
        .filter((r) => r.weight != null)
        .reverse().sortBy('date')
        .then((records) => {
          if (records.length > 0) {
            setWeights((prev) => ({ ...prev, [p.id]: records[0].weight }))
          }
        })
    })
  }, [periods])

  const hasActive = activePeriodId != null

  const handleDelete = async (id) => {
    if (window.confirm('确定删除这个减重期吗？所有相关数据将被永久删除。')) {
      await deletePeriod(id)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-zinc-800 tracking-tight">减重计划</h2>
          <p className="text-sm text-zinc-400 mt-1">管理你的减重周期</p>
        </div>
        <button
          onClick={() => navigate('/period/new')}
          disabled={hasActive}
          className="btn-primary"
          title={hasActive ? '当前有进行中的减重期' : ''}
        >
          + 新建计划
        </button>
      </div>

      {hasActive && (
        <div className="mb-6 px-4 py-3 bg-amber-50/50 border border-amber-100 rounded-2xl text-sm text-amber-700">
          当前有进行中的减重期，请完成后创建新计划
        </div>
      )}

      {periods.length === 0 ? (
        <div className="text-center py-24">
          <span className="text-5xl select-none">⚖</span>
          <p className="text-zinc-500 text-sm mt-4 mb-6">还没有减重计划</p>
          <button onClick={() => navigate('/period/new')} className="btn-primary">
            创建第一个减重期
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {periods.map((p) => {
            const endDate = getEndDate(p.startDate, p.totalDays)
            const targetLoss = getTargetLoss(p.initialWeight, p.targetWeight)
            const currentWeight = weights[p.id]
            const actualLoss = getActualLoss(p.initialWeight, currentWeight)
            const progress = getProgressPercent(p.initialWeight, p.targetWeight, currentWeight)
            const today = new Date().toISOString().split('T')[0]
            const isActive = p.id === activePeriodId
            const isEnded = today > endDate

            return (
              <div
                key={p.id}
                onClick={() => navigate(`/period/${p.id}`)}
                className="card cursor-pointer hover:border-zinc-300 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-zinc-800 truncate">{p.name}</h3>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-600'
                            : isEnded
                            ? 'bg-zinc-100 text-zinc-400'
                            : 'bg-sky-50 text-sky-600'
                        }`}
                      >
                        {isActive ? '进行中' : isEnded ? '已结束' : '未开始'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-[11px] text-zinc-400">天数</span>
                        <p className="font-medium text-zinc-700">{p.totalDays} 天</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-zinc-400">周期</span>
                        <p className="font-medium text-zinc-700 text-xs">{p.startDate} ~ {endDate}</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-zinc-400">体重</span>
                        <p className="font-medium text-zinc-700">{p.initialWeight} → {p.targetWeight} kg</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-zinc-400">已减 / 需减</span>
                        <p className="font-medium text-zinc-700">
                          <span className="text-emerald-600">{actualLoss}</span>
                          <span className="text-zinc-300 mx-1">/</span>
                          {targetLoss} kg
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-brand-600 w-9 text-right tabular-nums">
                        {progress}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}
                    className="ml-3 p-1.5 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="删除"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M4 6h16M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
