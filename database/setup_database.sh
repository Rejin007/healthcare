#!/bin/bash

# =============================================================================
# Nila Healthcare Database Setup Script
# =============================================================================
# This script runs all migrations in order and seeds an admin user
# Usage: bash setup_database.sh

set -e

# Load .env from backend
if [ -f "../backend/.env" ]; then
  export $(grep -v '^#' ../backend/.env | xargs)
elif [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-nila_healthcare}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-}

export PGPASSWORD=$DB_PASSWORD

echo "============================================="
echo " Nila Healthcare - Database Setup"
echo "============================================="
echo "Host: $DB_HOST:$DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Create database if not exists
echo "Creating database (if not exists)..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME"

# Run migrations
echo "Running migrations..."
MIGRATIONS_DIR="./migrations"
for file in $(ls $MIGRATIONS_DIR/*.sql | sort); do
  echo "  → $(basename $file)"
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file" > /dev/null 2>&1 || {
    echo "    (skipping - already exists)"
  }
done

# Seed admin user (password: Admin@123)
echo ""
echo "Seeding admin user..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'SEED'
  -- Insert admin user (password: Admin@123)
  INSERT INTO admin_users (full_name, email, password_hash, role_id, is_active)
  VALUES (
    'System Administrator',
    'admin@nilahealthcare.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
    (SELECT id FROM roles WHERE name = 'admin'),
    true
  )
  ON CONFLICT (email) DO NOTHING;
  SELECT 'Admin user seeded (if not exists)' as status;
SEED

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Admin credentials:"
echo "  Email:    admin@nilahealthcare.com"
echo "  Password: Admin@123"
echo ""
echo "⚠️  Change the admin password after first login!"
echo "============================================="
