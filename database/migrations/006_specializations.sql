-- Specializations table migration
CREATE TABLE specializations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE
);

CREATE TABLE expert_specializations (
  expert_id UUID REFERENCES experts(id),
  specialization_id INT REFERENCES specializations(id),
  PRIMARY KEY (expert_id, specialization_id)
);
