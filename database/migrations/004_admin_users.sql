-- Admin users table migration
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  password_hash TEXT,
  role_id INT REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);
