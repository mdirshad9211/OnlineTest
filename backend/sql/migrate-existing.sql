USE online_test;

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (id, name, description)
SELECT UUID(), 'General', 'Default category for existing assessments.'
WHERE NOT EXISTS (SELECT 1 FROM categories);

SET @category_column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tests' AND COLUMN_NAME = 'category_id'
);
SET @add_category_column = IF(
  @category_column_exists = 0,
  'ALTER TABLE tests ADD COLUMN category_id CHAR(36) NULL',
  'SELECT 1'
);
PREPARE add_category_column FROM @add_category_column;
EXECUTE add_category_column;
DEALLOCATE PREPARE add_category_column;

UPDATE tests SET category_id = (SELECT id FROM categories ORDER BY created_at LIMIT 1) WHERE category_id IS NULL;
ALTER TABLE tests MODIFY category_id CHAR(36) NOT NULL;

SET @category_fk_exists = (
  SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tests'
    AND COLUMN_NAME = 'category_id' AND REFERENCED_TABLE_NAME = 'categories'
);
SET @add_category_fk = IF(
  @category_fk_exists = 0,
  'ALTER TABLE tests ADD CONSTRAINT fk_tests_category FOREIGN KEY (category_id) REFERENCES categories(id)',
  'SELECT 1'
);
PREPARE add_category_fk FROM @add_category_fk;
EXECUTE add_category_fk;
DEALLOCATE PREPARE add_category_fk;

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
