-- Payment links table migration
CREATE TABLE payment_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  user_phone VARCHAR(20),
  user_email VARCHAR(255),
  link_url TEXT,
  expires_at TIMESTAMP,
  is_used BOOLEAN DEFAULT false
);
