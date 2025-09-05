# Single container for both frontend and backend - Railway deployment
FROM node:20-alpine AS frontend-builder

# Build Angular app
WORKDIR /app/frontend
COPY frontend/package*.json ./
# Remove Cypress from package.json for Docker build, then install dependencies
RUN sed -i '/"cypress"/d' package.json && \
    sed -i '/@cypress/d' package.json && \
    npm ci
COPY frontend/ ./
RUN npm run build

# Python backend with Angular static files
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy built Angular app to Django static files
COPY --from=frontend-builder /app/frontend/dist/grocery-frontend/browser/ ./staticfiles/

# Create non-root user
RUN adduser --disabled-password --gecos '' django
RUN chown -R django:django /app
USER django

# Expose port
EXPOSE 8000

# Collect static files and start server
CMD python manage.py collectstatic --noinput && \
    python manage.py migrate && \
    python manage.py seed_data && \
    gunicorn grocery_backend.wsgi:application --bind 0.0.0.0:8000