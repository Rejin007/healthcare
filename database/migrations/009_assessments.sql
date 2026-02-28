-- Assessments table migration
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255)
);

CREATE TABLE assessment_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id),
  question_text TEXT
);

CREATE TABLE assessment_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES assessment_questions(id),
  option_text TEXT,
  linked_expert_id UUID REFERENCES experts(id)
);
