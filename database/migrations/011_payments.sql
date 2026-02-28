-- Payments table migration
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  appointment_id UUID REFERENCES appointments(id),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  amount NUMERIC(10,2),
  currency VARCHAR(10),
  status VARCHAR(30),
  created_at TIMESTAMP DEFAULT now()
);
