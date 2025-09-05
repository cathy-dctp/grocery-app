# Single container for both frontend and backend - Railway deployment
#
# DEMO DATA SAFETY MECHANISMS:
# 
# This Dockerfile includes safety mechanisms to protect production user data
# when managing demo data. The following environment variables control behavior:
#
# SKIP_DEMO_DATA=true        - Skip all demo data creation (for production with real users)
# DEMO_DATA_CLEAN=true       - Create fresh demo data with safe cleanup (recommended for demos)
# DEMO_DATA_FORCE_CLEAN=true - Force clean demo data even in production (DANGEROUS - not recommended)
#
# Default behavior (no env vars): Create demo data without cleanup (safest for production)
#
# SAFETY FEATURES:
# • Only affects users with usernames 'john_doe' and 'jane_smith'
# • Checks for production environment and blocks unsafe operations
# • Verifies no shared data between demo and real users before cleanup
# • Preserves all non-demo user data
# • Uses database transactions for atomic operations
# • Provides detailed logging of all operations
#
# PRODUCTION DEPLOYMENT RECOMMENDATIONS:
# • For production with real users: Set SKIP_DEMO_DATA=true
# • For demo environments: Set DEMO_DATA_CLEAN=true
# • Never use DEMO_DATA_FORCE_CLEAN=true in production
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

# Create startup script for safer seed data management
COPY <<'EOF' /app/startup.sh
#!/bin/bash
set -e

echo "🚀 Starting Grocery App deployment..."

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

# Run database migrations
echo "🗄️  Running database migrations..."
python manage.py migrate

# Handle demo data based on environment
if [ "$SKIP_DEMO_DATA" = "true" ]; then
    echo "⏭️  Skipping demo data (SKIP_DEMO_DATA=true)"
elif [ "$DEMO_DATA_CLEAN" = "true" ]; then
    echo "🧹 Creating fresh demo data with cleanup..."
    python manage.py seed_data --clean --production-safe
elif [ "$DEMO_DATA_FORCE_CLEAN" = "true" ]; then
    echo "🧹 Force cleaning demo data (USE WITH CAUTION)..."
    python manage.py seed_data --clean --force-production
else
    echo "📊 Creating demo data (safe mode - no cleanup)..."
    python manage.py seed_data --production-safe
fi

echo "✅ Deployment preparation complete!"

# Start the application server
echo "🌐 Starting gunicorn server..."
exec gunicorn grocery_backend.wsgi:application --bind 0.0.0.0:8000
EOF

# Set permissions before creating non-root user
RUN chmod +x /app/startup.sh

# Create non-root user
RUN adduser --disabled-password --gecos '' django
RUN chown -R django:django /app
USER django

# Expose port
EXPOSE 8000

# Use the startup script
CMD ["/app/startup.sh"]