from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..database import get_db, User, Period, DailyActivity, DayRecord, WeeklySummary
from ..auth import get_current_user

router = APIRouter(prefix="/api/sync", tags=["sync"])


class PeriodData(BaseModel):
    localId: int
    name: str
    startDate: str
    totalDays: int
    initialWeight: Optional[float] = None
    targetWeight: Optional[float] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


class ActivityData(BaseModel):
    periodLocalId: int
    localId: int
    name: str
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


class RecordData(BaseModel):
    periodLocalId: int
    localId: Optional[int] = None
    date: str
    weight: Optional[float] = None
    caloriesBurned: Optional[float] = None
    activities: Optional[dict] = None
    notes: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


class SummaryData(BaseModel):
    periodLocalId: int
    localId: Optional[int] = None
    weekNumber: int
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    summary: Optional[str] = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


class SyncPushRequest(BaseModel):
    periods: Optional[List[PeriodData]] = []
    activities: Optional[List[ActivityData]] = []
    records: Optional[List[RecordData]] = []
    summaries: Optional[List[SummaryData]] = []
    deletedPeriods: Optional[List[int]] = []
    deletedActivities: Optional[List[int]] = []
    deletedRecords: Optional[List[int]] = []
    deletedSummaries: Optional[List[int]] = []


def format_period(p: Period) -> dict:
    return {
        "id": p.id,
        "localId": p.local_id,
        "name": p.name,
        "startDate": p.start_date,
        "totalDays": p.total_days,
        "initialWeight": p.initial_weight,
        "targetWeight": p.target_weight,
        "createdAt": p.created_at.isoformat() if p.created_at else None,
        "updatedAt": p.updated_at.isoformat() if p.updated_at else None,
    }


def format_activity(a: DailyActivity) -> dict:
    return {
        "id": a.id,
        "localId": a.local_id,
        "periodId": a.period_id,
        "name": a.name,
        "createdAt": a.created_at.isoformat() if a.created_at else None,
        "updatedAt": a.updated_at.isoformat() if a.updated_at else None,
    }


def format_record(r: DayRecord) -> dict:
    import json
    activities = {}
    try:
        activities = json.loads(r.activities or "{}")
    except Exception:
        pass
    return {
        "id": r.id,
        "localId": r.local_id,
        "periodId": r.period_id,
        "date": r.date,
        "weight": r.weight,
        "caloriesBurned": r.calories_burned,
        "activities": activities,
        "notes": r.notes,
        "createdAt": r.created_at.isoformat() if r.created_at else None,
        "updatedAt": r.updated_at.isoformat() if r.updated_at else None,
    }


def format_summary(s: WeeklySummary) -> dict:
    return {
        "id": s.id,
        "localId": s.local_id,
        "periodId": s.period_id,
        "weekNumber": s.week_number,
        "startDate": s.start_date,
        "endDate": s.end_date,
        "summary": s.summary,
        "createdAt": s.created_at.isoformat() if s.created_at else None,
        "updatedAt": s.updated_at.isoformat() if s.updated_at else None,
    }


def parse_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        if dt_str.endswith("Z"):
            dt_str = dt_str[:-1] + "+00:00"
        return datetime.fromisoformat(dt_str)
    except Exception:
        return datetime.utcnow()


@router.get("/pull")
def sync_pull(
    since: Optional[str] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user_id = user.id

    query_period = db.query(Period).filter(Period.user_id == user_id)
    query_activity = db.query(DailyActivity).filter(DailyActivity.user_id == user_id)
    query_record = db.query(DayRecord).filter(DayRecord.user_id == user_id)
    query_summary = db.query(WeeklySummary).filter(WeeklySummary.user_id == user_id)

    if since:
        since_dt = parse_datetime(since)
        query_period = query_period.filter(Period.updated_at > since_dt)
        query_activity = query_activity.filter(DailyActivity.updated_at > since_dt)
        query_record = query_record.filter(DayRecord.updated_at > since_dt)
        query_summary = query_summary.filter(WeeklySummary.updated_at > since_dt)

    return {
        "serverTime": datetime.utcnow().isoformat() + "Z",
        "periods": [format_period(p) for p in query_period.all()],
        "activities": [format_activity(a) for a in query_activity.all()],
        "records": [format_record(r) for r in query_record.all()],
        "summaries": [format_summary(s) for s in query_summary.all()],
        "deletedPeriods": [],
    }


@router.post("/push")
def sync_push(
    req: SyncPushRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user_id = user.id
    period_id_map = {}

    try:
        for p in req.periods:
            existing = (
                db.query(Period)
                .filter(and_(Period.user_id == user_id, Period.local_id == p.localId))
                .first()
            )
            if existing:
                existing.name = p.name
                existing.start_date = p.startDate
                existing.total_days = p.totalDays
                existing.initial_weight = p.initialWeight
                existing.target_weight = p.targetWeight
                existing.updated_at = parse_datetime(p.updatedAt) or datetime.utcnow()
            else:
                period = Period(
                    user_id=user_id,
                    local_id=p.localId,
                    name=p.name,
                    start_date=p.startDate,
                    total_days=p.totalDays,
                    initial_weight=p.initialWeight,
                    target_weight=p.targetWeight,
                    created_at=parse_datetime(p.createdAt) or datetime.utcnow(),
                    updated_at=parse_datetime(p.updatedAt) or datetime.utcnow(),
                )
                db.add(period)
                db.flush()
                existing = period

            server_period = (
                db.query(Period)
                .filter(and_(Period.user_id == user_id, Period.local_id == p.localId))
                .first()
            )
            if server_period:
                period_id_map[p.localId] = server_period.id

        for a in req.activities:
            server_period_id = period_id_map.get(a.periodLocalId)
            if not server_period_id:
                continue

            existing = (
                db.query(DailyActivity)
                .filter(
                    and_(
                        DailyActivity.user_id == user_id,
                        DailyActivity.period_id == server_period_id,
                        DailyActivity.local_id == a.localId,
                    )
                )
                .first()
            )
            if existing:
                existing.name = a.name
                existing.updated_at = parse_datetime(a.updatedAt) or datetime.utcnow()
            else:
                activity = DailyActivity(
                    user_id=user_id,
                    period_id=server_period_id,
                    local_id=a.localId,
                    name=a.name,
                    created_at=parse_datetime(a.createdAt) or datetime.utcnow(),
                    updated_at=parse_datetime(a.updatedAt) or datetime.utcnow(),
                )
                db.add(activity)

        for r in req.records:
            server_period_id = period_id_map.get(r.periodLocalId)
            if not server_period_id:
                continue

            import json
            activities_str = json.dumps(r.activities or {})

            existing = (
                db.query(DayRecord)
                .filter(
                    and_(
                        DayRecord.user_id == user_id,
                        DayRecord.period_id == server_period_id,
                        DayRecord.date == r.date,
                    )
                )
                .first()
            )
            if existing:
                new_updated = parse_datetime(r.updatedAt) or datetime.utcnow()
                if new_updated > (existing.updated_at or datetime.min):
                    existing.weight = r.weight
                    existing.calories_burned = r.caloriesBurned
                    existing.activities = activities_str
                    existing.notes = r.notes or ""
                    existing.updated_at = new_updated
            else:
                record = DayRecord(
                    user_id=user_id,
                    period_id=server_period_id,
                    local_id=r.localId,
                    date=r.date,
                    weight=r.weight,
                    calories_burned=r.caloriesBurned,
                    activities=activities_str,
                    notes=r.notes or "",
                    created_at=parse_datetime(r.createdAt) or datetime.utcnow(),
                    updated_at=parse_datetime(r.updatedAt) or datetime.utcnow(),
                )
                db.add(record)

        for s in req.summaries:
            server_period_id = period_id_map.get(s.periodLocalId)
            if not server_period_id:
                continue

            existing = (
                db.query(WeeklySummary)
                .filter(
                    and_(
                        WeeklySummary.user_id == user_id,
                        WeeklySummary.period_id == server_period_id,
                        WeeklySummary.week_number == s.weekNumber,
                    )
                )
                .first()
            )
            if existing:
                new_updated = parse_datetime(s.updatedAt) or datetime.utcnow()
                if new_updated > (existing.updated_at or datetime.min):
                    existing.start_date = s.startDate
                    existing.end_date = s.endDate
                    existing.summary = s.summary or ""
                    existing.updated_at = new_updated
            else:
                summary = WeeklySummary(
                    user_id=user_id,
                    period_id=server_period_id,
                    local_id=s.localId,
                    week_number=s.weekNumber,
                    start_date=s.startDate,
                    end_date=s.endDate,
                    summary=s.summary or "",
                    created_at=parse_datetime(s.createdAt) or datetime.utcnow(),
                    updated_at=parse_datetime(s.updatedAt) or datetime.utcnow(),
                )
                db.add(summary)

        for local_id in req.deletedPeriods:
            server_period = (
                db.query(Period)
                .filter(and_(Period.user_id == user_id, Period.local_id == local_id))
                .first()
            )
            if server_period:
                # 删除关联数据
                db.query(DailyActivity).filter(DailyActivity.period_id == server_period.id).delete()
                db.query(DayRecord).filter(DayRecord.period_id == server_period.id).delete()
                db.query(WeeklySummary).filter(WeeklySummary.period_id == server_period.id).delete()
                db.delete(server_period)

        for local_id in req.deletedActivities:
            activity = (
                db.query(DailyActivity)
                .filter(and_(DailyActivity.user_id == user_id, DailyActivity.local_id == local_id))
                .first()
            )
            if activity:
                db.delete(activity)

        for local_id in req.deletedRecords:
            record = (
                db.query(DayRecord)
                .filter(and_(DayRecord.user_id == user_id, DayRecord.local_id == local_id))
                .first()
            )
            if record:
                db.delete(record)

        for local_id in req.deletedSummaries:
            summary = (
                db.query(WeeklySummary)
                .filter(and_(WeeklySummary.user_id == user_id, WeeklySummary.local_id == local_id))
                .first()
            )
            if summary:
                db.delete(summary)

        db.commit()

        return {
            "message": "同步成功",
            "serverTime": datetime.utcnow().isoformat() + "Z",
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"同步失败: {str(e)}",
        )
