import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env'), override: true })

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
})

export async function withTransaction(callback) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

export async function ensureSchemaCompatibility() {
  const database = process.env.MYSQL_DATABASE
  if (!database) throw new Error('MYSQL_DATABASE is required.')

  const userColumns = [
    ['father_name', 'VARCHAR(120) NULL'],
    ['phone', 'VARCHAR(15) NULL'],
    ['aadhaar_number', 'CHAR(12) NULL'],
    ['location', 'VARCHAR(180) NULL'],
    ['school_name', 'VARCHAR(180) NULL'],
  ]
  for (const [column, definition] of userColumns) {
    const [[existingColumn]] = await pool.query(
      `SELECT COUNT(*) count
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
      [database, column],
    )
    if (!existingColumn.count) await pool.query(`ALTER TABLE users ADD COLUMN ${column} ${definition}`)
  }

  for (const [column, key] of [['phone', 'unique_user_phone'], ['aadhaar_number', 'unique_user_aadhaar']]) {
    const [[existingKey]] = await pool.query(
      `SELECT COUNT(*) count
       FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND INDEX_NAME = ?`,
      [database, key],
    )
    if (!existingKey.count) await pool.query(`ALTER TABLE users ADD UNIQUE KEY ${key} (${column})`)
  }

  for (const [column, definition] of [['category_id', 'CHAR(36) NULL']]) {
    const [[existingColumn]] = await pool.query(
      `SELECT COUNT(*) count
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
      [database, column],
    )
    if (!existingColumn.count) await pool.query(`ALTER TABLE users ADD COLUMN ${column} ${definition}`)
  }

  const [[userCategoryForeignKey]] = await pool.query(
    `SELECT COUNT(*) count
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'category_id' AND REFERENCED_TABLE_NAME = 'categories'`,
    [database],
  )

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE,
      description VARCHAR(500) NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const [[categoryColumn]] = await pool.query(
    `SELECT COUNT(*) count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tests' AND COLUMN_NAME = 'category_id'`,
    [database],
  )

  if (!categoryColumn.count) {
    await pool.query('ALTER TABLE tests ADD COLUMN category_id CHAR(36) NULL')
  }

  const [[questionSectionColumn]] = await pool.query(
    `SELECT COUNT(*) count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions' AND COLUMN_NAME = 'section'`,
    [database],
  )
  if (!questionSectionColumn.count) await pool.query(`ALTER TABLE questions ADD COLUMN section VARCHAR(120) NOT NULL DEFAULT ''`)

  const [[category]] = await pool.query('SELECT id FROM categories ORDER BY created_at LIMIT 1')
  if (!category) {
    await pool.query('INSERT INTO categories (id,name,description) VALUES (?,?,?)', [
      crypto.randomUUID(),
      'General',
      'Default category for existing assessments.',
    ])
  }

  await pool.query(`
    UPDATE tests
    SET category_id = (SELECT id FROM categories ORDER BY created_at LIMIT 1)
    WHERE category_id IS NULL
  `)
  await pool.query('ALTER TABLE tests MODIFY COLUMN category_id CHAR(36) NOT NULL')

  const [[foreignKey]] = await pool.query(
    `SELECT COUNT(*) count
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tests'
       AND COLUMN_NAME = 'category_id' AND REFERENCED_TABLE_NAME = 'categories'`,
    [database],
  )
  if (!foreignKey.count) {
    await pool.query('ALTER TABLE tests ADD CONSTRAINT fk_tests_category FOREIGN KEY (category_id) REFERENCES categories(id)')
  }

  if (!userCategoryForeignKey.count) {
    await pool.query('ALTER TABLE users ADD CONSTRAINT fk_users_category FOREIGN KEY (category_id) REFERENCES categories(id)')
  }
}
