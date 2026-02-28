-- Sessions table migration
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  refresh_token TEXT,
  device_info TEXT,
  ip_address TEXT,
  expires_at TIMESTAMP
);
