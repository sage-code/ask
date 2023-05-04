-- Users
CREATE INDEX idx_twitter ON Users (twitter);
CREATE INDEX idx_discord ON Users (discord);

-- Quizzes
CREATE INDEX idx_created_by ON Quizzes (created_by);
CREATE INDEX idx_is_active ON Quizzes (is_active);

-- Sections
CREATE INDEX idx_code ON Sections (code);
CREATE INDEX idx_section_order ON Sections (section_order);

-- Options
CREATE INDEX idx_code ON Questions (code);
CREATE INDEX idx_section_id ON Questions (section_id);
CREATE INDEX idx_question_id ON Options (question_id);

-- Attempts
CREATE INDEX idx_quiz_id ON Attempts (quiz_id);
CREATE INDEX idx_user_id ON Attempts (user_id);

-- Answers
CREATE INDEX idx_quiz_id ON Answers (quiz_id);
CREATE INDEX idx_user_id ON Answers (user_id);
CREATE INDEX idx_question_id ON Answers (question_id);