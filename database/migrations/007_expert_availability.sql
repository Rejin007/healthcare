-- Expert availability table migration
CREATE TABLE expert_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID REFERENCES experts(id),
  day_of_week INT, -- 0=Sunday
  start_time TIME,
  end_time TIME,
  mode VARCHAR(20) -- online/inperson
);
