import 'dotenv/config'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import { pool, withTransaction } from './db.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const schema = await fs.readFile(path.join(root, 'sql', 'schema.sql'), 'utf8')
const statements = schema.split(';').map((statement) => statement.trim()).filter(Boolean)
const hash = (password) => crypto.scryptSync(password, 'quizly-local-seed', 64).toString('hex')

const bootstrap = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
})
await bootstrap.query('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', [process.env.MYSQL_DATABASE])
await bootstrap.end()

for (const statement of statements) await pool.query(statement)

await withTransaction(async (connection) => {
  const [[existingAdmin]] = await connection.query('SELECT id FROM users WHERE email = ?', ['admin@quizly.test'])
  const adminId = existingAdmin?.id || crypto.randomUUID()
  if (!existingAdmin) await connection.query('INSERT INTO users (id,name,email,password_hash,role) VALUES (?,?,?,?,?)', [adminId, 'Quizly Admin', 'admin@quizly.test', hash('Admin123!'), 'admin'])
  const [[existingLearner]] = await connection.query('SELECT id FROM users WHERE email = ?', ['learner@quizly.test'])
  const learnerId = existingLearner?.id || crypto.randomUUID()
  if (!existingLearner) await connection.query('INSERT INTO users (id,name,email,password_hash,role) VALUES (?,?,?,?,?)', [learnerId, 'Jordan Davis', 'learner@quizly.test', hash('Learner123!'), 'learner'])
  const [[existingCategory]] = await connection.query('SELECT id FROM categories WHERE name = ?', ['Frontend Development'])
  const categoryId = existingCategory?.id || crypto.randomUUID()
  if (!existingCategory) await connection.query('INSERT INTO categories (id,name,description) VALUES (?,?,?)', [categoryId, 'Frontend Development', 'Frontend and web development assessments.'])
  const [[existingTest]] = await connection.query('SELECT id FROM tests WHERE title = ?', ['Frontend Development Assessment'])
  if (!existingTest) {
    const testId = crypto.randomUUID()
    await connection.query('INSERT INTO tests (id,title,description,category_id,duration_seconds,active,created_by) VALUES (?,?,?,?,?,?,?)', [testId, 'Frontend Development Assessment', 'A one-time assessment covering modern frontend fundamentals.', categoryId, 1500, true, adminId])
    const questions = [
      ['Which CSS layout system is designed for two-dimensional layouts?', ['Flexbox', 'Grid', 'Float', 'Position'], 'Grid'],
      ['What does HTML stand for?', ['HyperText Markup Language', 'HighText Machine Language', 'HyperTool Multi Language', 'Home Tool Markup Language'], 'HyperText Markup Language'],
      ['Which hook is used to manage local state in a React component?', ['useEffect', 'useContext', 'useState', 'useMemo'], 'useState'],
      ['Which attribute provides alternative text for an image?', ['src', 'title', 'alt', 'label'], 'alt'],
      ['What is the purpose of responsive web design?', ['Faster servers', 'Layouts that adapt to screen sizes', 'More database storage', 'Automatic translations'], 'Layouts that adapt to screen sizes'],
    ]
    for (const [index, [question, options, answer]] of questions.entries()) {
      const questionId = crypto.randomUUID()
      await connection.query('INSERT INTO questions (id,test_id,question_text,question_order,answer_key) VALUES (?,?,?,?,?)', [questionId, testId, question, index, answer])
      for (const [optionOrder, option] of options.entries()) await connection.query('INSERT INTO question_options (question_id,option_text,option_order) VALUES (?,?,?)', [questionId, option, optionOrder])
    }
    await connection.query('INSERT INTO test_assignments (test_id,learner_id) VALUES (?,?)', [testId, learnerId])
  }
})

await pool.end()
console.log('MySQL schema and seed data are ready.')
