export function getEndDate(startDate, totalDays) {
  const start = new Date(startDate)
  const end = new Date(start)
  end.setDate(end.getDate() + totalDays - 1)
  return end.toISOString().split('T')[0]
}

export function getTargetLoss(initialWeight, targetWeight) {
  return parseFloat((initialWeight - targetWeight).toFixed(1))
}

export function getTotalWeeks(totalDays) {
  return Math.ceil(totalDays / 7)
}

export function getWeeklyTargetLoss(initialWeight, targetWeight, totalDays) {
  const totalLoss = getTargetLoss(initialWeight, targetWeight)
  const weeks = getTotalWeeks(totalDays)
  return parseFloat((totalLoss / weeks).toFixed(2))
}

export function getWeekNumber(periodStartDate, date) {
  const start = new Date(periodStartDate)
  const target = new Date(date)
  const diffDays = Math.floor((target - start) / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 7) + 1
}

export function getWeekDateRange(periodStartDate, weekNumber, totalDays) {
  const start = new Date(periodStartDate)
  const weekStart = new Date(start)
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const periodEnd = new Date(start)
  periodEnd.setDate(periodEnd.getDate() + totalDays - 1)

  const actualEnd = weekEnd > periodEnd ? periodEnd : weekEnd

  return {
    startDate: weekStart.toISOString().split('T')[0],
    endDate: actualEnd.toISOString().split('T')[0],
  }
}

export function getWeekTargetWeight(initialWeight, targetWeight, totalDays, weekNumber) {
  const weeklyLoss = getWeeklyTargetLoss(initialWeight, targetWeight, totalDays)
  const lossSoFar = weeklyLoss * (weekNumber - 1)
  return parseFloat((initialWeight - lossSoFar).toFixed(1))
}

export function getActualLoss(initialWeight, currentWeight) {
  if (currentWeight == null) return 0
  return parseFloat((initialWeight - currentWeight).toFixed(1))
}

export function getProgressPercent(initialWeight, targetWeight, currentWeight) {
  if (currentWeight == null) return 0
  const totalLoss = getTargetLoss(initialWeight, targetWeight)
  if (totalLoss <= 0) return 100
  const actual = getActualLoss(initialWeight, currentWeight)
  return Math.min(100, Math.max(0, Math.round((actual / totalLoss) * 100)))
}

export function getWeightDiffFromPrev(currentWeight, prevWeight) {
  if (currentWeight == null || prevWeight == null) return null
  return parseFloat((currentWeight - prevWeight).toFixed(1))
}

export function getWeightDiffFromStart(initialWeight, currentWeight) {
  if (currentWeight == null || initialWeight == null) return null
  return parseFloat((initialWeight - currentWeight).toFixed(1))
}

export function getAllWeeks(period) {
  const weeks = getTotalWeeks(period.totalDays)
  const result = []
  for (let i = 1; i <= weeks; i++) {
    const range = getWeekDateRange(period.startDate, i, period.totalDays)
    const targetWeight = getWeekTargetWeight(
      period.initialWeight,
      period.targetWeight,
      period.totalDays,
      i
    )
    result.push({
      weekNumber: i,
      startDate: range.startDate,
      endDate: range.endDate,
      targetWeight,
      weeklyTargetLoss: getWeeklyTargetLoss(
        period.initialWeight,
        period.targetWeight,
        period.totalDays
      ),
    })
  }
  return result
}

export function calculateActivityStats(activities, dayRecords) {
  const stats = {}
  activities.forEach((a) => {
    stats[a.id] = { name: a.name, total: 0, completed: 0, percent: 0 }
  })

  dayRecords.forEach((record) => {
    if (!record.activities) return
    activities.forEach((a) => {
      if (record.activities[a.id] !== undefined) {
        stats[a.id].total++
        if (record.activities[a.id]) {
          stats[a.id].completed++
        }
      }
    })
  })

  Object.values(stats).forEach((s) => {
    s.percent = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
  })

  return stats
}

export function calculateWeekStats(period, dayRecords, weekNumber) {
  const range = getWeekDateRange(period.startDate, weekNumber, period.totalDays)
  const weekRecords = dayRecords.filter(
    (r) => r.date >= range.startDate && r.date <= range.endDate
  )

  const weights = weekRecords.filter((r) => r.weight != null).map((r) => r.weight)
  const totalCalories = weekRecords.reduce((sum, r) => sum + (r.caloriesBurned || 0), 0)
  const daysWithRecord = weekRecords.filter(
    (r) => r.weight != null || r.caloriesBurned != null || Object.keys(r.activities || {}).length > 0
  ).length

  const firstWeight = weekRecords.find((r) => r.weight != null)?.weight
  const lastWeight = [...weekRecords].reverse().find((r) => r.weight != null)?.weight
  const actualLoss = firstWeight != null && lastWeight != null
    ? parseFloat((firstWeight - lastWeight).toFixed(1))
    : null

  return {
    weekNumber,
    startDate: range.startDate,
    endDate: range.endDate,
    daysRecorded: daysWithRecord,
    avgWeight: weights.length > 0 ? parseFloat((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)) : null,
    totalCalories,
    actualLoss,
    plannedLoss: getWeeklyTargetLoss(period.initialWeight, period.targetWeight, period.totalDays),
  }
}

export function formatWeight(weight) {
  if (weight == null) return '--'
  return `${weight.toFixed(1)} kg`
}

export function formatDiff(diff) {
  if (diff == null) return '--'
  const sign = diff > 0 ? '+' : ''
  const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→'
  return `${sign}${diff.toFixed(1)} kg ${arrow}`
}

export function getDaysInWeek(periodStartDate, weekNumber, totalDays) {
  const range = getWeekDateRange(periodStartDate, weekNumber, totalDays)
  const days = []
  const start = new Date(range.startDate)
  const end = new Date(range.endDate)

  const periodStart = new Date(periodStartDate)
  const periodEnd = new Date(periodStart)
  periodEnd.setDate(periodEnd.getDate() + totalDays - 1)

  for (let d = new Date(start); d <= end && d <= periodEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d).toISOString().split('T')[0])
  }
  return days
}
