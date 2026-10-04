# backend/app.py
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
import uvicorn  # Add this
import os
from typing import List, Optional

from . import models, db, security, utils # Relative imports
# from models import UserCreate  # removed dot
# from db import get_db  # removed dot
# from security import create_access_token, verify_password  # removed dot
# from utils import load_model, preprocess_image, predict # removed dot

# Initialize FastAPI app
app = FastAPI(title="Airton Glaucoma Analysis API")  # Title and more descriptive

# Database setup
db.Base.metadata.create_all(bind=db.engine) #create db

# Load the model (once, when the app starts)
try:
    model = utils.load_model(os.path.join(os.path.dirname(__file__), "my_model2.h5")) #Relative path for local model
    print("Model loaded successfully!") #Add
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# ---- Helper Functions ----
def get_db():  # Function to get the database session
    db_session = db.SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()
# ---- User Authentication Routes ----

@app.post("/register", response_model=models.UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user: models.UserCreate, db: db.Session = Depends(get_db)): # changed db = Depends(get_db) to db_session
    # Check if user already exists
    existing_user = db.get_user_by_email(user.email, db=db)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # Hash the password
    hashed_password = security.hash_password(user.password) #Use from .security
    user_db = db.create_user(user, hashed_password, db=db)

    return user_db

@app.post("/login", response_model=models.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: db.Session = Depends(get_db)):
    user = db.authenticate_user(form_data.username, form_data.password, db=db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    access_token = security.create_access_token(data={"sub": user.email})  # Create from .security
    return {"access_token": access_token, "token_type": "bearer"}

# Dependency to get current user (protected routes)
def get_current_user(token: str = Depends(security.oauth2_scheme), db: db.Session = Depends(get_db)):
    try:
        payload = security.decode_token(token) # from security.py
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
        user = db.get_user_by_email(email, db=db)
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
        return user
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

# ---- Protected Routes ----

@app.post("/analyze", response_model=models.AnalysisResult)
async def analyze_image(file: UploadFile = File(...), current_user: models.UserRead = Depends(get_current_user), db: db.Session = Depends(get_db)):
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        contents = await file.read()
        image = utils.preprocess_image(contents)  # from .utils, preprocessed data

        # Run prediction
        prediction = utils.predict(model, image)

        # Store the analysis result in the database
        result = db.store_analysis_result(current_user.id, file.filename, prediction, db=db)

        return result

    except Exception as e:
        print(f"Error during analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {e}")

@app.get("/user/me", response_model=models.UserRead)
def read_users_me(current_user: models.UserRead = Depends(get_current_user)):
    return current_user

@app.get("/user/analysis_history", response_model=List[models.AnalysisResult])
def get_user_analysis_history(current_user: models.UserRead = Depends(get_current_user), db: db.Session = Depends(get_db)):
    analysis_results = db.get_analysis_history(current_user.id, db=db) # from db.py
    return analysis_results