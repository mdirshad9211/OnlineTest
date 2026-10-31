import dotenv from 'dotenv'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import XLSX from 'xlsx'
import { pool, withTransaction } from './db.js'

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.production') })

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const projectRoot = path.resolve(root, '..')
const schema = await fs.readFile(path.join(root, 'sql', 'schema.sql'), 'utf8')
const statements = schema.split(';').map((statement) => statement.trim()).filter(Boolean)
const hash = (password) => crypto.scryptSync(password, 'quizly-local-seed', 64).toString('hex')

const workbooks = [
  { file: 'Test_Med_10+1_Scholarship_Exam.xlsx', name: 'Med 10+1', title: 'Medical 10+1 Scholarship Examination' },
  { file: 'Test_Med_10plus2_All_100_Questions.xlsx', name: 'Med 10+2', title: 'Medical 10+2 Scholarship Examination' },
  { file: 'Test_NON_Med_10+1_Scholarship.xlsx', name: 'Non-Med 10+1', title: 'Non-Medical 10+1 Scholarship Examination' },
  { file: '10+2 non - med 123.xlsx', name: 'Non-Med 10+2', title: 'Non-Medical 10+2 Scholarship Examination' },
]

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()
const normalize = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]/g, '')

function findQuestionSheet(workbook) {
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' })
    const headerIndex = rows.findIndex((row) => {
      const values = row.map(normalize)
      return values.some((value) => value === 'question' || value === 'questiontext') &&
        values.some((value) => value.includes('optiona')) &&
        values.some((value) => value.includes('answer'))
    })
    if (headerIndex >= 0) return { sheet: workbook.Sheets[sheetName], headerIndex }
  }
  throw new Error('No question sheet with question, options A-D, and answer columns was found.')
}

function readQuestions(workbook) {
  const { sheet, headerIndex } = findQuestionSheet(workbook)
  const rows = XLSX.utils.sheet_to_json(sheet, { range: headerIndex, defval: '' })
  const headers = Object.keys(rows[0] || {})
  const column = (names) => headers.find((header) => names.includes(normalize(header)))
  const sectionColumn = column(['section'])
  const questionColumn = column(['question', 'questiontext'])
  const optionColumns = ['optiona', 'optionb', 'optionc', 'optiond'].map((name) => column([name]))
  const answerColumn = headers.find((header) => normalize(header).includes('answer'))
  if (!questionColumn || optionColumns.some((item) => !item) || !answerColumn) throw new Error('Required Excel columns are missing.')

  return rows.map((row) => {
    const options = optionColumns.map((option) => clean(row[option]))
    const answerKey = clean(row[answerColumn]).toUpperCase().replace(/[^A-D]/g, '').slice(0, 1)
    const answerIndex = answerKey ? answerKey.charCodeAt(0) - 65 : -1
    return {
      section: clean(row[sectionColumn]),
      question: clean(row[questionColumn]),
      options,
      answer: options[answerIndex] || '',
    }
  }).filter((item) => item.question && item.options.every(Boolean) && item.answer)
}

async function ensureTest(connection, adminId, definition) {
  const [[existing]] = await connection.query('SELECT id FROM tests WHERE title = ?', [definition.title])
  if (existing) return existing.id

  const [[existingCategory]] = await connection.query('SELECT id FROM categories WHERE name = ?', [definition.name])
  const categoryId = existingCategory?.id || crypto.randomUUID()
  if (!existingCategory) await connection.query('INSERT INTO categories (id,name,description) VALUES (?,?,?)', [
    categoryId,
    definition.name,
    `Scholarship assessment for ${definition.name}.`,
  ])
  const testId = crypto.randomUUID()
  await connection.query('INSERT INTO tests (id,title,description,category_id,duration_seconds,active,created_by) VALUES (?,?,?,?,?,?,?)', [
    testId,
    definition.title,
    `Scholarship assessment for ${definition.name}.`,
    categoryId,
    3600,
    true,
    adminId,
  ])

  const workbook = XLSX.readFile(path.join(projectRoot, definition.file))
  const questions = readQuestions(workbook)
  if (!questions.length) throw new Error(`No valid questions found in ${definition.file}.`)
  for (const [index, item] of questions.entries()) {
    const questionId = crypto.randomUUID()
    await connection.query('INSERT INTO questions (id,test_id,question_text,section,question_order,answer_key) VALUES (?,?,?,?,?,?)', [
      questionId,
      testId,
      item.question,
      item.section,
      index,
      item.answer,
    ])
    await connection.query('INSERT INTO question_options (question_id,option_text,option_order) VALUES ?', [
      item.options.map((option, optionIndex) => [questionId, option, optionIndex]),
    ])
  }
  console.log(`${definition.name}: imported ${questions.length} questions.`)
  return testId
}

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

  for (const definition of workbooks) await ensureTest(connection, adminId, definition)
})

await pool.end()
console.log('MySQL schema and Excel-backed test data are ready.')
