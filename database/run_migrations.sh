#!/bin/bash

# Database connection details
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="nila_healthcare"
DB_USER="postgres"

echo "🚀 Starting database migrations..."
echo "=================================="

# Array of migration files in order
migrations=(
    "001_init_extensions.sql"
    "002_users.sql"
    "003_roles.sql"
    "004_admin_users.sql"
    "005_experts.sql"
    "006_specializations.sql"
    "007_expert_availability.sql"
    "008_expert_pricing.sql"
    "009_assessments.sql"
    "010_appointments.sql"
    "011_payments.sql"
    "012_payment_links.sql"
    "013_notifications.sql"
    "014_otps.sql"
    "015_sessions.sql"
    "016_google_meet.sql"
    "017_analytics.sql"
)

# Run each migration
for migration in "${migrations[@]}"
do
    echo "📝 Running migration: $migration"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "migrations/$migration"
    
    if [ $? -eq 0 ]; then
        echo "✅ $migration completed successfully"
    else
        echo "❌ $migration failed"
        exit 1
    fi
    echo ""
done

echo "=================================="
echo "✅ All migrations completed successfully!"
