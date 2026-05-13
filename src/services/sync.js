import api from './api'
import db from '../db/database'

class SyncService {
  constructor() {
    this.syncing = false
    this.listeners = new Set()
  }

  onSyncStateChange(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  notifyListeners(state) {
    this.listeners.forEach((cb) => cb(state))
  }

  async sync() {
    if (this.syncing) return
    if (!api.isLoggedIn()) return

    this.syncing = true
    this.notifyListeners({ syncing: true, error: null })

    try {
      const lastSync = localStorage.getItem('last_sync_time') || null
      await this.pullFromServer(lastSync)

      localStorage.setItem('last_sync_time', new Date().toISOString())
      this.notifyListeners({ syncing: false, error: null, lastSync: new Date().toISOString() })
    } catch (err) {
      console.error('Sync failed:', err)
      this.notifyListeners({ syncing: false, error: err.message })
    } finally {
      this.syncing = false
    }
  }

  async pullFromServer(since) {
    const data = await api.pullData(since)

    if (data.deletedPeriods && data.deletedPeriods.length > 0) {
      for (const localId of data.deletedPeriods) {
        try { await db.periods.delete(localId) } catch {}
      }
    }

    if (data.periods && data.periods.length > 0) {
      for (const p of data.periods) {
        const localId = p.localId || p.id
        const existing = await db.periods.get(localId)
        if (existing) {
          await db.periods.update(localId, {
            name: p.name,
            startDate: p.startDate,
            totalDays: p.totalDays,
            initialWeight: p.initialWeight,
            targetWeight: p.targetWeight,
            syncedAt: new Date().toISOString(),
          })
        } else {
          await db.periods.put({
            id: localId,
            name: p.name,
            startDate: p.startDate,
            totalDays: p.totalDays,
            initialWeight: p.initialWeight,
            targetWeight: p.targetWeight,
            createdAt: p.createdAt,
            syncedAt: new Date().toISOString(),
          })
        }
      }
    }

    if (data.activities && data.activities.length > 0) {
      for (const a of data.activities) {
        const localId = a.localId || a.id
        const existing = await db.dailyActivities.get(localId)
        if (existing) {
          await db.dailyActivities.update(localId, {
            name: a.name,
            syncedAt: new Date().toISOString(),
          })
        } else {
          await db.dailyActivities.put({
            id: localId,
            periodId: a.periodLocalId || a.periodId,
            name: a.name,
            syncedAt: new Date().toISOString(),
          })
        }
      }
    }

    if (data.records && data.records.length > 0) {
      for (const r of data.records) {
        const localId = r.localId || r.id
        const existing = await db.dayRecords.get(localId)
        const recordData = {
          periodId: r.periodLocalId || r.periodId,
          date: r.date,
          weight: r.weight,
          caloriesBurned: r.caloriesBurned,
          activities: r.activities || {},
          notes: r.notes || '',
          syncedAt: new Date().toISOString(),
        }
        if (existing) {
          await db.dayRecords.update(localId, recordData)
        } else {
          await db.dayRecords.put({ id: localId, ...recordData })
        }
      }
    }

    if (data.summaries && data.summaries.length > 0) {
      for (const s of data.summaries) {
        const localId = s.localId || s.id
        const existing = await db.weeklySummaries.get(localId)
        const summaryData = {
          periodId: s.periodLocalId || s.periodId,
          weekNumber: s.weekNumber,
          startDate: s.startDate,
          endDate: s.endDate,
          summary: s.summary,
          syncedAt: new Date().toISOString(),
        }
        if (existing) {
          await db.weeklySummaries.update(localId, summaryData)
        } else {
          await db.weeklySummaries.put({ id: localId, ...summaryData })
        }
      }
    }
  }

  startAutoSync() {
    this.sync()

    this.intervalId = setInterval(() => {
      if (api.isLoggedIn() && navigator.onLine) {
        this.sync()
      }
    }, 5 * 60 * 1000)

    this.handleOnline = () => {
      if (api.isLoggedIn()) {
        this.sync()
      }
    }
    window.addEventListener('online', this.handleOnline)
  }

  stopAutoSync() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.handleOnline) {
      window.removeEventListener('online', this.handleOnline)
    }
  }
}

const syncService = new SyncService()
export default syncService