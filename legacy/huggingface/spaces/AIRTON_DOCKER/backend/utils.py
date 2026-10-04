# backend/utils.py
import tensorflow as tf  # Use tensorflow or keras if keras is installed as a different library
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.vgg16 import preprocess_input  # Or a preprocessing method for your model
import numpy as np
from io import BytesIO #For converting bytesIO to Image

def load_model(model_path): # Load using TF, changed due to multiple warnings for .h5 loading
    return tf.keras.models.load_model(model_path)
    # Load your trained model
    # model = tf.keras.models.load_model(model_path) #for using keras or tensorflow, change the install dependencies according to your code.
    # return model


def preprocess_image(image_bytes):
    # Use BytesIO to read the image from bytes
    img = image.load_img(BytesIO(image_bytes), target_size=(224, 224))  # Match the size your model expects
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)  # IMPORTANT: Use the same preprocessing as during training!  This assumes VGG16-like preprocessing; adapt if necessary.
    return img_array

def predict(model, image_array): #Add for analysis
    # Run the prediction
    prediction = model.predict(image_array)
    # Assuming a binary classification (glaucoma/no glaucoma) and model returns a probability
    # Customize the interpretation of the output based on your model
    if prediction[0][0] > 0.5: # Adjust threshold as needed
        result = "Glaucoma detected" #Output result to glaucoma or not
    else:
        result = "No glaucoma detected"

    return result #Return the prediction