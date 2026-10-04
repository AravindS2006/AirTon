# backend/models/analysis.py
from typing import Optional
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship

from ..db import Base  # Relative import
from datetime import datetime
class AnalysisResultBase(BaseModel):
    filename: str
    prediction: str

class AnalysisResultCreate(AnalysisResultBase):
    pass  # Or add any other fields required during creation

class AnalysisResult(AnalysisResultBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    prediction = Column(String) # store prediction details here.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="analysis_results") # relationship with user