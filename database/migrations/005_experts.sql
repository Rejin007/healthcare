-- Experts table migration
CREATE TABLE experts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES admin_users(id),
  bio TEXT,
  experience_years INT,
  profile_image TEXT,
  is_active BOOLEAN DEFAULT true
);
