-- Users table stores user information
CREATE TABLE Users (
  id INT PRIMARY KEY,
  name VARCHAR(50),
  twitter VARCHAR(50),
  discord VARCHAR(50),
  created_date TIMESTAMP,
  score INT
);

-- Quizzes table stores quiz information
CREATE TABLE Quizzes (
  id INT PRIMARY KEY,
  topic VARCHAR(50),
  is_active BOOLEAN,
  created_by INT,
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES Users(id)
);

-- Sections table stores section information for each quiz
CREATE TABLE Sections (
  id INT PRIMARY KEY,
  code VARCHAR(50),
  title VARCHAR(50),
  section_order INT,
  quiz_id INT,
  CONSTRAINT fk_quiz_id FOREIGN KEY (quiz_id) REFERENCES Quizzes(id)
);

-- Questions table stores question information for each section
CREATE TABLE Questions (
  id INT PRIMARY KEY,
  code VARCHAR(50),
  title VARCHAR(50),
  section_id INT,
  CONSTRAINT fk_section_id FOREIGN KEY (section_id) REFERENCES Sections(id)
);

-- Options table stores options for each question
CREATE TABLE Options (
  id INT PRIMARY KEY,
  option_text VARCHAR(50),
  is_correct BOOLEAN,
  question_id INT,
  CONSTRAINT fk_question_id FOREIGN KEY (question_id) REFERENCES Questions(id)
);

-- Attempts table stores attempts made by each user for each quiz
CREATE TABLE Attempts (
  id INT PRIMARY KEY,
  quiz_id INT,
  user_id INT,
  score INT,
  CONSTRAINT fk_quiz_id FOREIGN KEY (quiz_id) REFERENCES Quizzes(id),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- Answers table stores answers submitted by each user for each question
CREATE TABLE Answers (
  id INT PRIMARY KEY,
  question_id INT,
  user_id INT,
  option_id INT,
  quiz_id INT,
  CONSTRAINT fk_question_id FOREIGN KEY (question_id) REFERENCES Questions(id),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES Users(id),
  CONSTRAINT fk_option_id FOREIGN KEY (option_id) REFERENCES Options(id),
  CONSTRAINT fk_quiz_id FOREIGN KEY (quiz_id) REFERENCES Quizzes(id)
);