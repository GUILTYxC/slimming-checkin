const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.use(authMiddleware)

router.get('/pull', (req, res) => {
  const { since } = req.query
  const userId = req.userId

  const periods = since
    ? db.prepare('SELECT * FROM periods WHERE user_id = ? AND updated_at > ?').all(userId, since)
    : db.prepare('SELECT * FROM periods WHERE user_id = ?').all(userId)

  const activities = since
    ? db.prepare('SELECT * FROM daily_activities WHERE user_id = ? AND updated_at > ?').all(userId, since)
    : db.prepare('SELECT * FROM daily_activities WHERE user_id = ?').all(userId)

  const records = since
    ? db.prepare('SELECT * FROM day_records WHERE user_id = ? AND updated_at > ?').all(userId, since)
    : db.prepare('SELECT * FROM day_records WHERE user_id = ?').all(userId)

  const summaries = since
    ? db.prepare('SELECT * FROM weekly_summaries WHERE user_id = ? AND updated_at > ?').all(userId, since)
    : db.prepare('SELECT * FROM weekly_summaries WHERE user_id = ?').all(userId)

  const deletedPeriods = since
    ? db.prepare("SELECT local_id FROM sync_deletes WHERE user_id = ? AND table_name = 'periods' AND deleted_at > ?").all(userId, since)
    : []

  res.json({
    serverTime: new Date().toISOString(),
    periods: periods.map(formatPeriod),
    activities: activities.map(formatActivity),
    records: records.map(formatRecord),
    summaries: summaries.map(formatSummary),
    deletedPeriods: deletedPeriods.map(d => d.local_id),
  })
})

router.post('/push', (req, res) => {
  const userId = req.userId
  const { periods, activities, records, summaries, deletedPeriods } = req.body

  const insertOrUpdatePeriod = db.prepare(`
    INSERT INTO periods (user_id, local_id, name, start_date, total_days, initial_weight, target_weight, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, local_id) DO UPDATE SET
      name = excluded.name,
      start_date = excluded.start_date,
      total_days = excluded.total_days,
      initial_weight = excluded.initial_weight,
      target_weight = excluded.target_weight,
      updated_at = excluded.updated_at
  `)

  const insertOrUpdateActivity = db.prepare(`
    INSERT INTO daily_activities (user_id, period_id, local_id, name, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, period_id, local_id) DO UPDATE SET
      name = excluded.name,
      updated_at = excluded.updated_at
  `)

  const insertOrUpdateRecord = db.prepare(`
    INSERT INTO day_records (user_id, period_id, local_id, date, weight, calories_burned, activities, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, period_id, date) DO UPDATE SET
      weight = excluded.weight,
      calories_burned = excluded.calories_burned,
      activities = excluded.activities,
      notes = excluded.notes,
      updated_at = CASE WHEN excluded.updated_at > day_records.updated_at THEN excluded.updated_at ELSE day_records.updated_at END
  `)

  const insertOrUpdateSummary = db.prepare(`
    INSERT INTO weekly_summaries (user_id, period_id, local_id, week_number, start_date, end_date, summary, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, period_id, week_number) DO UPDATE SET
      start_date = excluded.start_date,
      end_date = excluded.end_date,
      summary = excluded.summary,
      updated_at = CASE WHEN excluded.updated_at > weekly_summaries.updated_at THEN excluded.updated_at ELSE weekly_summaries.updated_at END
  `)

  const getServerPeriodId = db.prepare('SELECT id FROM periods WHERE user_id = ? AND local_id = ?')

  const transaction = db.transaction(() => {
    const periodIdMap = {}

    if (periods && periods.length > 0) {
      for (const p of periods) {
        const result = insertOrUpdatePeriod.run(
          userId, p.localId, p.name, p.startDate, p.totalDays,
          p.initialWeight, p.targetWeight, p.createdAt, p.updatedAt
        )
        const serverPeriod = getServerPeriodId.get(userId, p.localId)
        periodIdMap[p.localId] = serverPeriod.id
      }
    }

    if (activities && activities.length > 0) {
      for (const a of activities) {
        const serverPeriodId = periodIdMap[a.periodLocalId]
        if (!serverPeriodId) continue
        insertOrUpdateActivity.run(
          userId, serverPeriodId, a.localId, a.name, a.createdAt, a.updatedAt
        )
      }
    }

    if (records && records.length > 0) {
      for (const r of records) {
        const serverPeriodId = periodIdMap[r.periodLocalId]
        if (!serverPeriodId) continue
        insertOrUpdateRecord.run(
          userId, serverPeriodId, r.localId, r.date,
          r.weight, r.caloriesBurned,
          JSON.stringify(r.activities || {}),
          r.notes || '', r.createdAt, r.updatedAt
        )
      }
    }

    if (summaries && summaries.length > 0) {
      for (const s of summaries) {
        const serverPeriodId = periodIdMap[s.periodLocalId]
        if (!serverPeriodId) continue
        insertOrUpdateSummary.run(
          userId, serverPeriodId, s.localId, s.weekNumber,
          s.startDate, s.endDate, s.summary, s.createdAt, s.updatedAt
        )
      }
    }

    if (deletedPeriods && deletedPeriods.length > 0) {
      for (const localId of deletedPeriods) {
        const serverPeriod = getServerPeriodId.get(userId, localId)
        if (serverPeriod) {
          db.prepare('DELETE FROM periods WHERE id = ? AND user_id = ?').run(serverPeriod.id, userId)
        }
      }
    }
  })

  try {
    transaction()
    res.json({
      message: '同步成功',
      serverTime: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Sync push error:', err)
    res.status(500).json({ error: '同步失败: ' + err.message })
  }
})

function formatPeriod(row) {
  return {
    id: row.id,
    localId: row.local_id,
    name: row.name,
    startDate: row.start_date,
    totalDays: row.total_days,
    initialWeight: row.initial_weight,
    targetWeight: row.target_weight,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function formatActivity(row) {
  return {
    id: row.id,
    localId: row.local_id,
    periodId: row.period_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function formatRecord(row) {
  let activities = {}
  try { activities = JSON.parse(row.activities || '{}') } catch {}
  return {
    id: row.id,
    localId: row.local_id,
    periodId: row.period_id,
    date: row.date,
    weight: row.weight,
    caloriesBurned: row.calories_burned,
    activities,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function formatSummary(row) {
  return {
    id: row.id,
    localId: row.local_id,
    periodId: row.period_id,
    weekNumber: row.week_number,
    startDate: row.start_date,
    endDate: row.end_date,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

module.exports = router