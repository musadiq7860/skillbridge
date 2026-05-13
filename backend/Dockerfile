FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set up writable cache for Hugging Face models
ENV HF_HOME=/app/.cache
RUN mkdir -p /app/.cache && chmod 777 /app/.cache

# Install dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# HuggingFace Spaces requires port 7860
EXPOSE 7860

# Start the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
