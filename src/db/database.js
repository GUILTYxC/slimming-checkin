import Dexie from 'dexie'

const db = new Dexie('SlimmingDB')

db.version(1).stores({
  periods: '++id, startDate',
  dailyActivities: '++id, periodId',
  dayRecords: '++id, periodId, date, [periodId+date]',
  weeklySummaries: '++id, periodId, weekNumber, [periodId+weekNumber]',
})

export default db

export function addPeriod(period) {
  return db.periods.add({
    name: period.name,
    startDate: period.startDate,
    totalDays: period.totalDays,
    initialWeight: period.initialWeight,
    targetWeight: period.targetWeight,
    createdAt: new Date().toISOString(),
  })
}

export function updatePeriod(id, updates) {
  return db.periods.update(id, updates)
}

export function getPeriod(id) {
  return db.periods.get(id)
}

export function getAllPeriods() {
  return db.periods.orderBy('startDate').toArray()
}

export function deletePeriod(id) {
  return db.transaction('rw', db.periods, db.dailyActivities, db.dayRecords, db.weeklySummaries, async () => {
    await db.dailyActivities.where('periodId').equals(id).delete()
    await db.dayRecords.where('periodId').equals(id).delete()
    await db.weeklySummaries.where('periodId').equals(id).delete()
    await db.periods.delete(id)
  })
}

// Daily Activities
export function addDailyActivity(activity) {
  return db.dailyActivities.add({
    periodId: activity.periodId,
    name: activity.name,
  })
}

export function getPeriodActivities(periodId) {
  return db.dailyActivities.where('periodId').equals(periodId).toArray()
}

export function deletePeriodActivities(periodId) {
  return db.dailyActivities.where('periodId').equals(periodId).delete()
}

export function updateDailyActivity(id, updates) {
  return db.dailyActivities.update(id, updates)
}

export function deleteDailyActivity(id) {
  return db.dailyActivities.delete(id)
}

// Day Records
export function saveDayRecord(record) {
  const existing = db.dayRecords.where('[periodId+date]').equals([record.periodId, record.date])
  return db.dayRecords.put({
    id: record.id,
    periodId: record.periodId,
    date: record.date,
    weight: record.weight ?? null,
    caloriesBurned: record.caloriesBurned ?? null,
    activities: record.activities || {},
    notes: record.notes || '',
  })
}

export function getDayRecord(periodId, date) {
  return db.dayRecords.where('[periodId+date]').equals([periodId, date]).first()
}

export function getPeriodDayRecords(periodId) {
  return db.dayRecords.where('periodId').equals(periodId).toArray()
}

export function deleteDayRecord(id) {
  return db.dayRecords.delete(id)
}

// Weekly Summaries
export function saveWeeklySummary(summary) {
  if (summary.id) {
    return db.weeklySummaries.update(summary.id, {
      summary: summary.summary,
      weekNumber: summary.weekNumber,
      startDate: summary.startDate,
      endDate: summary.endDate,
    })
  }
  return db.weeklySummaries.put({
    periodId: summary.periodId,
    weekNumber: summary.weekNumber,
    startDate: summary.startDate,
    endDate: summary.endDate,
    summary: summary.summary,
    createdAt: new Date().toISOString(),
  })
}

export function getWeeklySummary(periodId, weekNumber) {
  return db.weeklySummaries.where('[periodId+weekNumber]').equals([periodId, weekNumber]).first()
}

export function getPeriodWeeklySummaries(periodId) {
  return db.weeklySummaries.where('periodId').equals(periodId).toArray()
}
