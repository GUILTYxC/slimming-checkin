export default function ActivityStats({ stats }) {
  const entries = Array.isArray(stats) ? stats : Object.values(stats || {})

  if (entries.length === 0) {
    return (
      <p className="text-xs text-zinc-400">暂无活动数据</p>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((s, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-zinc-600">{s.name}</span>
            <span className="text-xs font-medium text-zinc-400 tabular-nums">
              {s.completed}/{s.total}
            </span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-700 ease-out"
              style={{ width: `${s.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
