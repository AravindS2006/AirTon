from pydantic import BaseModel
from typing import Optional
import tensorflow as tf
from PIL import Image, ImageOps
import numpy as np
import io
from starlette.responses import FileResponse
from fastapi import FastAPI, File, UploadFile
from pathlib import Path




app = FastAPI()
html_file_path = Path(__file__).parent / "index.html"

# Load your model
model = tf.keras.models.load_model('my_model2.h5')

class ImageData(BaseModel):
    file: bytes

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    try:
        # Read the uploaded file as bytes
        image_bytes = await file.read()
        
        # Convert bytes to image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Process the image
        image = ImageOps.fit(image, (100, 100), Image.ANTIALIAS)
        image = image.convert('RGB')
        image = np.asarray(image)
        image = image.astype(np.float32) / 255.0
        img_reshape = image[np.newaxis, ...]

        # Predict using the model
        prediction = model.predict(img_reshape)
        pred = prediction[0][0]

        result = {
            'prediction': 'Healthy' if pred > 0.5 else 'Affected by Glaucoma'
        }
        return result
    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def greet():
      return FileResponse(html_file_path)