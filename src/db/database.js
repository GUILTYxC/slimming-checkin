import Dexie from 'dexie'
import api from '../services/api'

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

db.version(3).stores({
  periods: '++id, startDate, updatedAt, syncedAt',
  dailyActivities: '++id, periodId, updatedAt, syncedAt',
  dayRecords: '++id, periodId, date, [periodId+date], updatedAt, syncedAt',
  weeklySummaries: '++id, periodId, weekNumber, [periodId+weekNumber], updatedAt, syncedAt',
  deletedItems: '++id, itemType, itemId, periodLocalId, deletedAt, synced',
})

export default db

export async function addPeriod(period) {
  const now = new Date().toISOString()
  const id = await db.periods.add({
    name: period.name,
    startDate: period.startDate,
    totalDays: period.totalDays,
    initialWeight: period.initialWeight,
    targetWeight: period.targetWeight,
    createdAt: now,
    updatedAt: now,
    syncedAt: now,
  })

  if (api.isLoggedIn()) {
    try {
      await api.createPeriod({
        localId: id,
        name: period.name,
        startDate: period.startDate,
        totalDays: period.totalDays,
        initialWeight: period.initialWeight,
        targetWeight: period.targetWeight,
      })
    } catch (err) {
      console.error('Failed to sync period to server:', err)
    }
  }

  return id
}

export async function updatePeriod(id, updates) {
  const now = new Date().toISOString()
  await db.periods.update(id, { ...updates, updatedAt: now, syncedAt: now })

  if (api.isLoggedIn()) {
    try {
      await api.updatePeriod(id, updates)
    } catch (err) {
      console.error('Failed to sync period update to server:', err)
    }
  }
}

export function getPeriod(id) {
  return db.periods.get(id)
}

export function getAllPeriods() {
  return db.periods.orderBy('startDate').toArray()
}

export async function deletePeriod(id) {
  await db.transaction('rw', db.periods, db.dailyActivities, db.dayRecords, db.weeklySummaries, async () => {
    await db.dailyActivities.where('periodId').equals(id).delete()
    await db.dayRecords.where('periodId').equals(id).delete()
    await db.weeklySummaries.where('periodId').equals(id).delete()
    await db.periods.delete(id)
  })

  if (api.isLoggedIn()) {
    try {
      await api.deletePeriod(id)
    } catch (err) {
      console.error('Failed to sync period deletion to server:', err)
    }
  }
}

export async function addDailyActivity(activity) {
  const now = new Date().toISOString()
  const id = await db.dailyActivities.add({
    periodId: activity.periodId,
    name: activity.name,
    createdAt: now,
    updatedAt: now,
    syncedAt: now,
  })

  if (api.isLoggedIn()) {
    try {
      await api.createActivity({
        periodLocalId: activity.periodId,
        localId: id,
        name: activity.name,
      })
    } catch (err) {
      console.error('Failed to sync activity to server:', err)
    }
  }

  return id
}

export function getPeriodActivities(periodId) {
  return db.dailyActivities.where('periodId').equals(periodId).toArray()
}

export async function deletePeriodActivities(periodId) {
  const activities = await db.dailyActivities.where('periodId').equals(periodId).toArray()
  await db.dailyActivities.where('periodId').equals(periodId).delete()

  if (api.isLoggedIn()) {
    for (const a of activities) {
      try {
        await api.deleteActivity(a.id)
      } catch (err) {
        console.error('Failed to sync activity deletion to server:', err)
      }
    }
  }
}

export async function updateDailyActivity(id, updates) {
  const now = new Date().toISOString()
  await db.dailyActivities.update(id, { ...updates, updatedAt: now, syncedAt: now })

  if (api.isLoggedIn()) {
    try {
      await api.updateActivity(id, updates)
    } catch (err) {
      console.error('Failed to sync activity update to server:', err)
    }
  }
}

export async function deleteDailyActivity(id) {
  await db.dailyActivities.delete(id)

  if (api.isLoggedIn()) {
    try {
      await api.deleteActivity(id)
    } catch (err) {
      console.error('Failed to sync activity deletion to server:', err)
    }
  }
}

export async function saveDayRecord(record) {
  const now = new Date().toISOString()
  const id = await db.dayRecords.put({
    id: record.id,
    periodId: record.periodId,
    date: record.date,
    weight: record.weight ?? null,
    caloriesBurned: record.caloriesBurned ?? null,
    activities: record.activities || {},
    notes: record.notes || '',
    createdAt: record.createdAt || now,
    updatedAt: now,
    syncedAt: now,
  })

  if (api.isLoggedIn()) {
    try {
      await api.saveRecord({
        periodLocalId: record.periodId,
        localId: id,
        date: record.date,
        weight: record.weight,
        caloriesBurned: record.caloriesBurned,
        activities: record.activities,
        notes: record.notes,
      })
    } catch (err) {
      console.error('Failed to sync record to server:', err)
    }
  }

  return id
}

export function getDayRecord(periodId, date) {
  return db.dayRecords.where('[periodId+date]').equals([periodId, date]).first()
}

export function getPeriodDayRecords(periodId) {
  return db.dayRecords.where('periodId').equals(periodId).toArray()
}

export async function deleteDayRecord(id) {
  await db.dayRecords.delete(id)

  if (api.isLoggedIn()) {
    try {
      await api.deleteRecord(id)
    } catch (err) {
      console.error('Failed to sync record deletion to server:', err)
    }
  }
}

export async function saveWeeklySummary(summary) {
  const now = new Date().toISOString()
  if (summary.id) {
    await db.weeklySummaries.update(summary.id, {
      summary: summary.summary,
      weekNumber: summary.weekNumber,
      startDate: summary.startDate,
      endDate: summary.endDate,
      updatedAt: now,
      syncedAt: now,
    })
  } else {
    summary.id = await db.weeklySummaries.put({
      periodId: summary.periodId,
      weekNumber: summary.weekNumber,
      startDate: summary.startDate,
      endDate: summary.endDate,
      summary: summary.summary,
      createdAt: now,
      updatedAt: now,
      syncedAt: now,
    })
  }

  if (api.isLoggedIn()) {
    try {
      await api.saveSummary({
        periodLocalId: summary.periodId,
        localId: summary.id,
        weekNumber: summary.weekNumber,
        startDate: summary.startDate,
        endDate: summary.endDate,
        summary: summary.summary,
      })
    } catch (err) {
      console.error('Failed to sync summary to server:', err)
    }
  }

  return summary.id
}

export function getWeeklySummary(periodId, weekNumber) {
  return db.weeklySummaries.where('[periodId+weekNumber]').equals([periodId, weekNumber]).first()
}

export function getPeriodWeeklySummaries(periodId) {
  return db.weeklySummaries.where('periodId').equals(periodId).toArray()
}