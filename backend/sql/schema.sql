CREATE DATABASE IF NOT EXISTS online_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE online_test;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  father_name VARCHAR(120) NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(15) NULL UNIQUE,
  aadhaar_number CHAR(12) NULL UNIQUE,
  location VARCHAR(180) NULL,
  school_name VARCHAR(180) NULL,
  category_id CHAR(36) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'learner') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tests (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  category_id CHAR(36) NOT NULL,
  duration_seconds INT UNSIGNED NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tests_creator FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT fk_tests_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS questions (
  id CHAR(36) PRIMARY KEY,
  test_id CHAR(36) NOT NULL,
  question_text TEXT NOT NULL,
  section VARCHAR(120) NOT NULL DEFAULT '',
  question_order INT UNSIGNED NOT NULL,
  answer_key VARCHAR(500) NOT NULL,
  CONSTRAINT fk_questions_test FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_options (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id CHAR(36) NOT NULL,
  option_text VARCHAR(500) NOT NULL,
  option_order INT UNSIGNED NOT NULL,
  CONSTRAINT fk_options_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_assignments (
  test_id CHAR(36) NOT NULL,
  learner_id CHAR(36) NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (test_id, learner_id),
  CONSTRAINT fk_assignments_test FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignments_learner FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attempts (
  id CHAR(36) PRIMARY KEY,
  test_id CHAR(36) NOT NULL,
  learner_id CHAR(36) NOT NULL,
  score INT UNSIGNED NOT NULL,
  total_questions INT UNSIGNED NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_learner_attempt (test_id, learner_id),
  CONSTRAINT fk_attempts_test FOREIGN KEY (test_id) REFERENCES tests(id),
  CONSTRAINT fk_attempts_learner FOREIGN KEY (learner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attempt_answers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  attempt_id CHAR(36) NOT NULL,
  question_id CHAR(36) NOT NULL,
  answer_text VARCHAR(500) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE IF NOT EXISTS feedback (
  id CHAR(36) PRIMARY KEY,
  test_id CHAR(36) NOT NULL,
  learner_id CHAR(36) NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment VARCHAR(2000) NOT NULL DEFAULT '',
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_learner_feedback (test_id, learner_id),
  CONSTRAINT fk_feedback_test FOREIGN KEY (test_id) REFERENCES tests(id),
  CONSTRAINT fk_feedback_learner FOREIGN KEY (learner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS exam_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  test_id CHAR(36) NOT NULL,
  learner_id CHAR(36) NOT NULL,
  event_type ENUM('tab_hidden','window_blur','fullscreen_exit','copy_attempt','paste_attempt','context_menu') NOT NULL,
  metadata JSON NULL,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_events_test FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  CONSTRAINT fk_events_learner FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
);
