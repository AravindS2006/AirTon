# backend/models/user.py
from typing import Optional
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from ..db import Base  # Relative import
from datetime import datetime
# Pydantic models
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str  # Plain text password for creation

class UserRead(UserBase):
    id: int
    created_at: datetime #Add
    class Config:
        orm_mode = True

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    analysis_results = relationship("AnalysisResult", back_populates="user") #back populate relationship
class Token(BaseModel):
    access_token: str
    token_type: str