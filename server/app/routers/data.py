from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..database import get_db, User, Period, DailyActivity, DayRecord, WeeklySummary
from ..auth import get_current_user

router = APIRouter(prefix="/api/data", tags=["data"])


class PeriodCreate(BaseModel):
    localId: int
    name: str
    startDate: str
    totalDays: int
    initialWeight: Optional[float] = None
    targetWeight: Optional[float] = None


class PeriodUpdate(BaseModel):
    name: Optional[str] = None
    startDate: Optional[str] = None
    totalDays: Optional[int] = None
    initialWeight: Optional[float] = None
    targetWeight: Optional[float] = None


class ActivityCreate(BaseModel):
    periodLocalId: int
    localId: int
    name: str


class ActivityUpdate(BaseModel):
    name: str


class RecordSave(BaseModel):
    periodLocalId: int
    localId: Optional[int] = None
    date: str
    weight: Optional[float] = None
    caloriesBurned: Optional[float] = None
    activities: Optional[dict] = None
    notes: Optional[str] = ""


class SummarySave(BaseModel):
    periodLocalId: int
    localId: Optional[int] = None
    weekNumber: int
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    summary: Optional[str] = ""


def get_server_period_id(db: Session, user_id: int, local_id: int) -> Optional[int]:
    period = db.query(Period).filter(
        and_(Period.user_id == user_id, Period.local_id == local_id)
    ).first()
    return period.id if period else None


@router.post("/periods")
def create_period(
    req: PeriodCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    existing = db.query(Period).filter(
        and_(Period.user_id == user.id, Period.local_id == req.localId)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="计划已存在")

    period = Period(
        user_id=user.id,
        local_id=req.localId,
        name=req.name,
        start_date=req.startDate,
        total_days=req.totalDays,
        initial_weight=req.initialWeight,
        target_weight=req.targetWeight,
    )
    db.add(period)
    db.commit()
    db.refresh(period)
    return {"id": period.id, "localId": period.local_id}


@router.put("/periods/{local_id}")
def update_period(
    local_id: int,
    req: PeriodUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    period = db.query(Period).filter(
        and_(Period.user_id == user.id, Period.local_id == local_id)
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="计划不存在")

    if req.name is not None:
        period.name = req.name
    if req.startDate is not None:
        period.start_date = req.startDate
    if req.totalDays is not None:
        period.total_days = req.totalDays
    if req.initialWeight is not None:
        period.initial_weight = req.initialWeight
    if req.targetWeight is not None:
        period.target_weight = req.targetWeight
    period.updated_at = datetime.utcnow()

    db.commit()
    return {"success": True}


@router.delete("/periods/{local_id}")
def delete_period(
    local_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    period = db.query(Period).filter(
        and_(Period.user_id == user.id, Period.local_id == local_id)
    ).first()
    if not period:
        return {"success": True}

    db.delete(period)
    db.commit()
    return {"success": True}


@router.post("/activities")
def create_activity(
    req: ActivityCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    server_period_id = get_server_period_id(db, user.id, req.periodLocalId)
    if not server_period_id:
        raise HTTPException(status_code=404, detail="计划不存在")

    activity = DailyActivity(
        user_id=user.id,
        period_id=server_period_id,
        local_id=req.localId,
        name=req.name,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return {"id": activity.id, "localId": activity.local_id}


@router.put("/activities/{local_id}")
def update_activity(
    local_id: int,
    req: ActivityUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    activity = db.query(DailyActivity).filter(
        and_(DailyActivity.user_id == user.id, DailyActivity.local_id == local_id)
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="活动不存在")

    activity.name = req.name
    activity.updated_at = datetime.utcnow()
    db.commit()
    return {"success": True}


@router.delete("/activities/{local_id}")
def delete_activity(
    local_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    activity = db.query(DailyActivity).filter(
        and_(DailyActivity.user_id == user.id, DailyActivity.local_id == local_id)
    ).first()
    if not activity:
        return {"success": True}

    db.delete(activity)
    db.commit()
    return {"success": True}


@router.post("/records")
def save_record(
    req: RecordSave,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    server_period_id = get_server_period_id(db, user.id, req.periodLocalId)
    if not server_period_id:
        raise HTTPException(status_code=404, detail="计划不存在")

    import json
    activities_str = json.dumps(req.activities or {})

    existing = db.query(DayRecord).filter(
        and_(
            DayRecord.user_id == user.id,
            DayRecord.period_id == server_period_id,
            DayRecord.date == req.date,
        )
    ).first()

    if existing:
        existing.weight = req.weight
        existing.calories_burned = req.caloriesBurned
        existing.activities = activities_str
        existing.notes = req.notes or ""
        existing.updated_at = datetime.utcnow()
        db.commit()
        return {"id": existing.id, "localId": existing.local_id}
    else:
        record = DayRecord(
            user_id=user.id,
            period_id=server_period_id,
            local_id=req.localId,
            date=req.date,
            weight=req.weight,
            calories_burned=req.caloriesBurned,
            activities=activities_str,
            notes=req.notes or "",
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return {"id": record.id, "localId": record.local_id}


@router.delete("/records/{local_id}")
def delete_record(
    local_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    record = db.query(DayRecord).filter(
        and_(DayRecord.user_id == user.id, DayRecord.local_id == local_id)
    ).first()
    if not record:
        return {"success": True}

    db.delete(record)
    db.commit()
    return {"success": True}


@router.post("/summaries")
def save_summary(
    req: SummarySave,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    server_period_id = get_server_period_id(db, user.id, req.periodLocalId)
    if not server_period_id:
        raise HTTPException(status_code=404, detail="计划不存在")

    existing = db.query(WeeklySummary).filter(
        and_(
            WeeklySummary.user_id == user.id,
            WeeklySummary.period_id == server_period_id,
            WeeklySummary.week_number == req.weekNumber,
        )
    ).first()

    if existing:
        existing.start_date = req.startDate
        existing.end_date = req.endDate
        existing.summary = req.summary or ""
        existing.updated_at = datetime.utcnow()
        db.commit()
        return {"id": existing.id, "localId": existing.local_id}
    else:
        summary = WeeklySummary(
            user_id=user.id,
            period_id=server_period_id,
            local_id=req.localId,
            week_number=req.weekNumber,
            start_date=req.startDate,
            end_date=req.endDate,
            summary=req.summary or "",
        )
        db.add(summary)
        db.commit()
        db.refresh(summary)
        return {"id": summary.id, "localId": summary.local_id}


@router.delete("/summaries/{local_id}")
def delete_summary(
    local_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    summary = db.query(WeeklySummary).filter(
        and_(WeeklySummary.user_id == user.id, WeeklySummary.local_id == local_id)
    ).first()
    if not summary:
        return {"success": True}

    db.delete(summary)
    db.commit()
    return {"success": True}