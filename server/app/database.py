from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Period(Base):
    __tablename__ = "periods"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    local_id = Column(Integer)
    name = Column(String, nullable=False)
    start_date = Column(String, nullable=False)
    total_days = Column(Integer, nullable=False)
    initial_weight = Column(Float)
    target_weight = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "local_id", name="uq_period_user_local"),
        Index("idx_periods_user", "user_id"),
    )


class DailyActivity(Base):
    __tablename__ = "daily_activities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    period_id = Column(Integer, ForeignKey("periods.id", ondelete="CASCADE"), nullable=False)
    local_id = Column(Integer)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "period_id", "local_id", name="uq_activity_user_period_local"),
        Index("idx_activities_period", "period_id"),
    )


class DayRecord(Base):
    __tablename__ = "day_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    period_id = Column(Integer, ForeignKey("periods.id", ondelete="CASCADE"), nullable=False)
    local_id = Column(Integer)
    date = Column(String, nullable=False)
    weight = Column(Float)
    calories_burned = Column(Float)
    activities = Column(Text, default="{}")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "period_id", "date", name="uq_record_user_period_date"),
        Index("idx_records_period_date", "period_id", "date"),
    )


class WeeklySummary(Base):
    __tablename__ = "weekly_summaries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    period_id = Column(Integer, ForeignKey("periods.id", ondelete="CASCADE"), nullable=False)
    local_id = Column(Integer)
    week_number = Column(Integer, nullable=False)
    start_date = Column(String)
    end_date = Column(String)
    summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "period_id", "week_number", name="uq_summary_user_period_week"),
        Index("idx_summaries_period", "period_id"),
    )


def init_db():
    Base.metadata.create_all(bind=engine)
