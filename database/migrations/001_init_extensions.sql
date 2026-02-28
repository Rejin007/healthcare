-- Initialize database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE schema_migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT UNIQUE,
  executed_at TIMESTAMP DEFAULT now()
);
