-- Google Meet integration table migration
CREATE TABLE google_meet_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id),
  meet_url TEXT,
  created_at TIMESTAMP DEFAULT now()
);
