import streamlit as st
import tensorflow as tf
import numpy as np
from PIL import Image, ImageOps
import io
import base64
import json  # Import the json module

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development purposes)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Load the model (replace with your actual model loading)
def load_model():
    try:
        model = tf.keras.models.load_model("my_model2.h5")  # Assuming in same directory
        return model
    except Exception as e:
        print(f"Error loading model: {e}")  # Print to console for debugging
        return None

model = load_model()

# --- Image Processing and Prediction ---
def predict_glaucoma(image):
    if model is None:
        print("Model not loaded.")  # Print to console for debugging
        return "Error: Model not loaded"

    try:
        # Process the image
        image = ImageOps.fit(image, (100, 100), Image.LANCZOS)
        image = image.convert('RGB')
        image = np.asarray(image)
        image = image.astype(np.float32) / 255.0
        img_reshape = image[np.newaxis, ...]

        # Predict using the model
        prediction = model.predict(img_reshape)
        pred = prediction[0][0]

        # Determine classification
        if pred > 0.5:
            result = "Healthy"
        else:
            result = "Affected by Glaucoma"

        return result

    except Exception as e:
        print(f"Error during prediction: {e}")  # Print to console for debugging
        return "Error during prediction"

# --- FastAPI Endpoints ---
@app.post("/predict/")
async def predict(request: Request):
    try:
        data = await request.json()
        image_data = data["image_data"]

        # Decode the Base64 image data
        image_encoded = image_data.split(",")[1]
        image_bytes = base64.b64decode(image_encoded)
        image = Image.open(io.BytesIO(image_bytes))

        diagnosis = predict_glaucoma(image)

        return JSONResponse({"prediction": diagnosis})  # Return JSON response
    except Exception as e:
        print(f"Error processing prediction request: {e}")  # Print to console
        return JSONResponse({"prediction": "Error processing image"}, status_code=500)

# --- Streamlit App (minimal) ---
st.components.v1.html(open("index.html", 'r', encoding='utf-8').read(), height=800, scrolling=False)