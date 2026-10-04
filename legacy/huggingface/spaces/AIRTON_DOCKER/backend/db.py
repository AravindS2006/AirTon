# backend/db.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from . import models  # Relative import

DATABASE_URL = "sqlite:///./airton.db"  # Use SQLite for simplicity, change for production
#DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://user:password@host/dbname")
engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ---- Helper functions ----

# Database operations
def get_user_by_email(email: str, db: SessionLocal):
    return db.query(models.User).filter(models.User.email == email).first() # Use from .models

def create_user(user: models.UserCreate, hashed_password: str, db: SessionLocal):
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
# ---- Authenticate User
def authenticate_user(email: str, password: str, db: SessionLocal): #Authenticate function to db
    user = db.query(models.User).filter(models.User.email == email).first()
    if user and user.hashed_password and security.verify_password(password, user.hashed_password): # verify password check user exist in sec
        return user
    return None

def store_analysis_result(user_id: int, filename: str, prediction: str, db: SessionLocal):
    result = models.AnalysisResult(user_id=user_id, filename=filename, prediction=prediction)  # Use models from .models
    db.add(result)
    db.commit()
    db.refresh(result)
    return result

def get_analysis_history(user_id: int, db: SessionLocal):
    return db.query(models.AnalysisResult).filter(models.AnalysisResult.user_id == user_id).order_by(models.AnalysisResult.created_at.desc()).all() # fetch the details using userid and sort them