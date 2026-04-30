export default function WeekProgress({ weeks, currentWeek, onWeekClick }) {
  return (
    <div className="space-y-1.5">
      {weeks.map((w) => {
        const isCurrent = w.weekNumber === currentWeek
        const isPast = w.weekNumber < currentWeek

        return (
          <button
            key={w.weekNumber}
            onClick={() => onWeekClick?.(w.weekNumber)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-150 ${
              isCurrent
                ? 'bg-brand-50 border border-brand-200'
                : isPast
                ? 'bg-zinc-50 hover:bg-zinc-100 border border-zinc-100'
                : 'bg-white border border-zinc-100 hover:border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center ${
                    isCurrent
                      ? 'bg-brand-200 text-brand-700'
                      : isPast
                      ? 'bg-zinc-200 text-zinc-500'
                      : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  {w.weekNumber}
                </span>
                <div>
                  <span className="text-xs text-zinc-400">
                    {w.startDate} ~ {w.endDate}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400">目标</span>
                <span className="ml-1 text-sm font-semibold text-zinc-700 tabular-nums">
                  {w.targetWeight} kg
                </span>
              </div>
            </div>

            {isCurrent && (
              <div className="mt-2 text-[10px] text-brand-600 font-medium">
                当前周
              </div>
            )}
            {isPast && w.actual != null && (
              <div className="mt-2 flex gap-4 text-[10px]">
                <span className="text-zinc-400">
                  计划 -{w.weeklyTargetLoss} kg
                </span>
                <span
                  className={
                    w.actual >= w.weeklyTargetLoss
                      ? 'text-emerald-500'
                      : 'text-amber-500'
                  }
                >
                  实际 -{w.actual} kg
                </span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
