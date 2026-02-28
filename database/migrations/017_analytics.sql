-- Analytics table migration
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE,
  total_bookings INT,
  total_revenue NUMERIC(12,2),
  new_users INT,
  completed_sessions INT
);
