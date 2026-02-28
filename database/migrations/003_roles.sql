-- Roles table migration
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (name)
VALUES ('admin'), ('manager'), ('expert'), ('frontdesk');
