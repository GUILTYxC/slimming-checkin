import Dexie from 'dexie'

const db = new Dexie('SlimmingDB')

db.version(1).stores({
  periods: '++id, startDate',
  dailyActivities: '++id, periodId',
  dayRecords: '++id, periodId, date, [periodId+date]',
  weeklySummaries: '++id, periodId, weekNumber, [periodId+weekNumber]',
})

db.version(2).stores({
  periods: '++id, startDate, updatedAt, syncedAt',
  dailyActivities: '++id, periodId, updatedAt, syncedAt',
  dayRecords: '++id, periodId, date, [periodId+date], updatedAt, syncedAt',
  weeklySummaries: '++id, periodId, weekNumber, [periodId+weekNumber], updatedAt, syncedAt',
}).upgrade(async (tx) => {
  const now = new Date().toISOString()
  await tx.table('periods').toCollection().modify((p) => { p.updatedAt = p.createdAt || now; p.syncedAt = null })
  await tx.table('dailyActivities').toCollection().modify((a) => { a.updatedAt = now; a.syncedAt = null })
  await tx.table('dayRecords').toCollection().modify((r) => { r.updatedAt = now; r.syncedAt = null })
  await tx.table('weeklySummaries').toCollection().modify((s) => { s.updatedAt = s.createdAt || now; s.syncedAt = null })
})

export default db

export function addPeriod(period) {
  const now = new Date().toISOString()
  return db.periods.add({
    name: period.name,
    startDate: period.startDate,
    totalDays: period.totalDays,
    initialWeight: period.initialWeight,
    targetWeight: period.targetWeight,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  })
}

export function updatePeriod(id, updates) {
  return db.periods.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
    syncedAt: null,
  })
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

export function addDailyActivity(activity) {
  const now = new Date().toISOString()
  return db.dailyActivities.add({
    periodId: activity.periodId,
    name: activity.name,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  })
}

export function getPeriodActivities(periodId) {
  return db.dailyActivities.where('periodId').equals(periodId).toArray()
}

export function deletePeriodActivities(periodId) {
  return db.dailyActivities.where('periodId').equals(periodId).delete()
}

export function updateDailyActivity(id, updates) {
  return db.dailyActivities.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
    syncedAt: null,
  })
}

export function deleteDailyActivity(id) {
  return db.dailyActivities.delete(id)
}

export function saveDayRecord(record) {
  const now = new Date().toISOString()
  return db.dayRecords.put({
    id: record.id,
    periodId: record.periodId,
    date: record.date,
    weight: record.weight ?? null,
    caloriesBurned: record.caloriesBurned ?? null,
    activities: record.activities || {},
    notes: record.notes || '',
    createdAt: record.createdAt || now,
    updatedAt: now,
    syncedAt: null,
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

export function saveWeeklySummary(summary) {
  const now = new Date().toISOString()
  if (summary.id) {
    return db.weeklySummaries.update(summary.id, {
      summary: summary.summary,
      weekNumber: summary.weekNumber,
      startDate: summary.startDate,
      endDate: summary.endDate,
      updatedAt: now,
      syncedAt: null,
    })
  }
  return db.weeklySummaries.put({
    periodId: summary.periodId,
    weekNumber: summary.weekNumber,
    startDate: summary.startDate,
    endDate: summary.endDate,
    summary: summary.summary,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
  })
}

export function getWeeklySummary(periodId, weekNumber) {
  return db.weeklySummaries.where('[periodId+weekNumber]').equals([periodId, weekNumber]).first()
}

export function getPeriodWeeklySummaries(periodId) {
  return db.weeklySummaries.where('periodId').equals(periodId).toArray()
}