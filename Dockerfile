# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgcc-s1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p backend/uploads

# Expose port
EXPOSE 8000

# Set environment variables
ENV FLASK_APP=backend/app.py
ENV FLASK_ENV=production

# Command to run the application
CMD ["gunicorn", "backend.app:app", "--bind", "0.0.0.0:8000", "--workers", "4"]
