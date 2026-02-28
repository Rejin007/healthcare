-- Expert pricing table migration
CREATE TABLE expert_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID REFERENCES experts(id),
  mode VARCHAR(20),
  price NUMERIC(10,2),
  currency VARCHAR(10) DEFAULT 'INR'
);
