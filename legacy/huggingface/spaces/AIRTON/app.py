import gradio as gr
import tensorflow as tf  # or torch
from skimage import io, transform
import numpy as np
from PIL import Image  # For handling image format

# --- 1. Load your Model ---
try:
    model = tf.keras.models.load_model('my_model2.h5')  # Load your model
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None  # Handle model loading failure gracefully


# --- 2. Image Preprocessing Function ---
def preprocess_image(image):
    img = Image.fromarray(image).resize((224, 224)) # Resize if your model expects a specific size
    img_array = np.array(img) / 255.0  # Normalize pixel values (adjust based on your model's training)
    img_array = np.expand_dims(img_array, axis=0) # Add batch dimension if your model expects it
    return img_array

# --- 3. Prediction Function ---
def predict_glaucoma(image):
    if model is None:
        return "Model not loaded. Please check logs.", None  # Handle case where model didn't load

    processed_image = preprocess_image(image)
    try:
        prediction = model.predict(processed_image)

        # --- Interpret Prediction (Adjust based on your model's output) ---
        glaucoma_probability = prediction[0][0]  # Assuming binary classification and output is probability of glaucoma
        is_glaucoma = glaucoma_probability > 0.5 # Example threshold - adjust as needed
        diagnosis = "Glaucoma Detected" if is_glaucoma else "No Glaucoma Detected"

        # --- Simple Visualization (Placeholder - Improve this later) ---
        visual_output = f"Probability of Glaucoma: {glaucoma_probability:.4f}\nDiagnosis: {diagnosis}"

        return visual_output, image  # Return text result and the input image (for display)

    except Exception as e:
        return f"Error during prediction: {e}", image # Error handling during prediction

# --- 4. Gradio Interface ---
iface = gr.Interface(
    fn=predict_glaucoma,
    inputs=gr.Image(type="pil"), # Use "pil" type for PIL Image objects
    outputs=[
        gr.Textbox(label="Analysis Result"),
        gr.Image(label="Input Image")  # Display the input image back
    ],
    examples=['example_fundus.jpg', 'example_healthy.jpg'], # Add example images to your repository
    title="Airton: Glaucoma Detection from Fundus Images",
    description="Upload a fundus image and our AI model will analyze it to detect potential signs of glaucoma.",
    theme="dark" # Initial dark theme
)

iface.launch()