import os
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = os.getenv("DB_PATH", str(DATA_DIR / "slimming.db"))
DATABASE_URL = f"sqlite:///{DB_PATH}"

JWT_SECRET = os.getenv("JWT_SECRET", "slimming-ds-change-this-secret-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30

PORT = int(os.getenv("PORT", "3001"))
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "*")
