-- Appointments table migration
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  expert_id UUID REFERENCES experts(id),
  mode VARCHAR(20),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR(30),
  created_by VARCHAR(30), -- user/frontdesk/admin
  payment_id UUID,
  google_meet_link TEXT,
  created_at TIMESTAMP DEFAULT now()
);
