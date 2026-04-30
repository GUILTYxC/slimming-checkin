export default function ProgressBar({ percent, label, showPercent = true, height = 'h-2' }) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div>
      {label && (
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs font-medium text-zinc-500">{label}</span>
          {showPercent && (
            <span className="text-xs font-semibold text-zinc-600 tabular-nums">
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-zinc-100 rounded-full ${height} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out bg-brand-600`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
