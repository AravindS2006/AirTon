---
language:
- en
license: mit
library_name: torchvision
tags:
- medical
- image-classification
- healthcare
- glaucoma
- pytorch
- efficientnet
- segmentation
datasets:
- acrima
metrics:
- accuracy
- roc_auc
pipeline_tag: image-classification
---

# 👁️ Thiruvizhi: Advanced AI Glaucoma Diagnosis System

<div align="center">

![Status](https://img.shields.io/badge/Status-Research_Preview-blue)
![Framework](https://img.shields.io/badge/Framework-PyTorch-red)
![Architecture](https://img.shields.io/badge/Backbone-EfficientNet_B0-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

**A dual-module AI system combining U-Net segmentation and EfficientNet classification for the early detection of Glaucoma from fundus images.**

</div>

## 📝 Model Details

**Thiruvizhi** (Tamil for "Divine Eye") is a research-grade deep learning pipeline designed to assist in the diagnosis of Glaucoma. Unlike standard classifiers, this system integrates a segmentation step to understand optic disc structure and uses explainable AI (Grad-CAM) to visualize decision-making.

*   **Author:** [AravindS2006](https://huggingface.co/AravindS2006)
*   **Model Type:** Binary Image Classifier (Glaucoma vs. Normal)
*   **Architecture:** 
    *   **Backbone:** EfficientNet-B0 (Pretrained on ImageNet)
    *   **Head:** Custom Fully Connected Layer with Dropout (0.3)
    *   **Loss Function:** Focal Loss (to handle class imbalance)
*   **Input Resolution:** 256x256 pixels

## 💻 System Architecture

The model operates within a 4-stage pipeline:

1.  **Preprocessing (CLAHE):** Applies *Contrast Limited Adaptive Histogram Equalization* to the L-channel of the LAB color space. This highlights the Optic Nerve Head (ONH) details often obscured in raw fundus images.
2.  **Segmentation (U-Net):** A custom U-Net module locates the Optic Disc. *(Note: Trained on heuristic masks for demonstration).*
3.  **Classification (EfficientNet):** The core diagnostic engine. It uses transfer learning to detect pathological features (like high Cup-to-Disc Ratio).
4.  **Explainability:** Uses **Grad-CAM** to generate heatmaps, ensuring the model is looking at the optic disc and not image artifacts.

## 📊 Training Data

The model was trained on the **ACRIMA Dataset** (Architecture for Convolutional Neural Networks applied to Retinal Images for Medical Analysis).

*   **Source:** [Figshare (ID: 7613135)](https://figshare.com/articles/dataset/ACRIMA_database/7613135)
*   **Classes:** Glaucoma (Positive) vs. Normal (Negative).
*   **Augmentations:** Random Horizontal Flip, Rotation (±10°), Color Jitter (Brightness/Contrast).

## 🚀 How to Use

Since this model uses a custom architecture definition, you must define the class structure before loading the weights.

### 1. Installation
```bash
pip install torch torchvision opencv-python pillow

### 2. Inference Code
```python
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import cv2
import numpy as np
import os
from urllib.request import urlretrieve

# --- 1. Define Architecture (Must match training) ---
class GlaucomaClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        # Load backbone without weights initially
        self.backbone = models.efficientnet_b0(weights=None)
        
        # Recreate the classifier head exactly as trained
        num_ftrs = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(num_ftrs, 1)
        )

    def forward(self, x):
        return self.backbone(x)

# --- 2. Preprocessing Function (Crucial!) ---
def preprocess_image(image_path):
    # Load and convert to RGB
    img = Image.open(image_path).convert("RGB")
    img_np = np.array(img)
    
    # Apply CLAHE (Contrast Enhancement)
    # This matches the training pipeline exactly
    lab = cv2.cvtColor(img_np, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    cl = clahe.apply(l)
    final_img = cv2.cvtColor(cv2.merge((cl,a,b)), cv2.COLOR_LAB2RGB)
    
    # Normalize
    transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    return transform(Image.fromarray(final_img)).unsqueeze(0)

# --- 3. Main Prediction Function ---
def predict(image_path, model_path='best_glaucoma_model.pth'):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Initialize model
    model = GlaucomaClassifier().to(device)

    # Load weights
    if not os.path.exists(model_path):
        print(f"Model file '{model_path}' not found. Please download it from the 'Files' tab.")
        return

    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    # Preprocess
    try:
        img_tensor = preprocess_image(image_path).to(device)
    except FileNotFoundError:
        print(f"Error: Image file not found at '{image_path}'")
        return
    except Exception as e:
        print(f"Error processing image: {e}")
        return

    # Inference
    with torch.no_grad():
        logit = model(img_tensor)
        prob = torch.sigmoid(logit).item()

    # Output
    print("-" * 30)
    print(f"Image: {os.path.basename(image_path)}")
    print(f"Glaucoma Probability: {prob*100:.2f}%")
    print(f"Diagnosis: {'GLAUCOMA' if prob > 0.5 else 'NORMAL'}")
    print("-" * 30)

# --- Example Usage ---
if __name__ == '__main__':
    # Create a dummy image for testing if you don't have one
    if not os.path.exists("test_eye.jpg"):
        print("Creating a dummy test image: 'test_eye.jpg'")
        dummy_image = np.random.randint(0, 255, (400, 400, 3), dtype=np.uint8)
        Image.fromarray(dummy_image).save("test_eye.jpg")

    # NOTE: To run this, you must first download 'best_glaucoma_model.pth'
    # from the "Files and versions" tab of the Hugging Face repository.
    # Place it in the same directory as this script.
    
    model_file = "best_glaucoma_model.pth"
    image_file = "test_eye.jpg"
    
    if os.path.exists(model_file):
        predict(image_path=image_file, model_path=model_file)
    else:
        print(f"\n--- PLEASE NOTE ---")
        print(f"The model weights file ('{model_file}') was not found.")
        print("Download it from the Hugging Face repository's 'Files' tab to run the prediction.")

```

## ⚠️ Limitations & Bias

*   **Not a Medical Device:** This model is a research prototype. It is **not** FDA/CE approved for clinical diagnosis and should not be used as a substitute for a professional ophthalmologist's evaluation.
*   **Heuristic Segmentation:** The segmentation module in this pipeline was trained using heuristic pseudo-masks (based on red-channel brightness) due to the lack of ground truth masks in the ACRIMA dataset. It serves an auxiliary role and is not a clinically accurate segmentation tool.
*   **Data Bias:** The model's performance is tied to the characteristics of the ACRIMA dataset. It may underperform on images with different lighting conditions, resolutions, or from different fundus camera models.

## 📚 Citation

If you use this model or its code in your research, please cite the original dataset:

```bibtex
@article{diaz2019acrima,
  title={ACRIMA Database},
  author={Diaz-Pinto, Andres and Morales, Sandra and Naranjo, Valery and K{\"o}hler, Thomas},
  journal={Figshare},
  year={2019},
  doi={10.6084/m9.figshare.7613135.v1},
  url={https://figshare.com/articles/dataset/ACRIMA_database/7613135}
}
```
```