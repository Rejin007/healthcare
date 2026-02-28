-- Notifications table migration
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  admin_user_id UUID,
  type VARCHAR(50),
  channel VARCHAR(50), -- whatsapp/sms/email/inapp
  message TEXT,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
