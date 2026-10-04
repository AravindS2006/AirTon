# Dockerfile
FROM python:3.9-slim-buster

# Set environment variables (for example)
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV TZ=Asia/Kolkata  # Adjust your timezone  <- Removed inline comment

# Insert the missing space if we need

# Install system dependencies (important)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \  #Added for image visualization, related to GUI issues
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*