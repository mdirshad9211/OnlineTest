import 'dotenv/config'
import cors from 'cors'
import crypto from 'node:crypto'
import express from 'express'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import XLSX from 'xlsx'
import { ensureSchemaCompatibility, pool, withTransaction } from './db.js'

const app = express()
const port = process.env.PORT || 4000
const jwtSecret = process.env.JWT_SECRET

if (!jwtSecret) throw new Error('JWT_SECRET is required.')

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '100kb' }))
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role })
const durationLabel = (seconds) => `${Math.ceil(seconds / 60)} minutes`
const passwordHash = (password) => crypto.scryptSync(password, 'quizly-local-seed', 64).toString('hex')

async function getTest(testId, includeAnswers = false) {
  const [tests] = await pool.query('SELECT t.id,t.title,t.description,t.duration_seconds,t.active,t.category_id,c.name category_name FROM tests t JOIN categories c ON c.id=t.category_id WHERE t.id = ?', [testId])
  if (!tests[0]) return null
  const [questions] = await pool.query('SELECT id,question_text,section,question_order,answer_key FROM questions WHERE test_id = ? ORDER BY question_order', [testId])
  const [options] = questions.length ? await pool.query('SELECT question_id,option_text,option_order FROM question_options WHERE question_id IN (?) ORDER BY option_order', [questions.map((question) => question.id)]) : [[]]
  const [assignments] = await pool.query('SELECT learner_id FROM test_assignments WHERE test_id = ?', [testId])
  return {
    id: tests[0].id, title: tests[0].title, description: tests[0].description, categoryId: tests[0].category_id, categoryName: tests[0].category_name, duration: durationLabel(tests[0].duration_seconds), durationSeconds: tests[0].duration_seconds, active: Boolean(tests[0].active), assignedLearners: assignments.map((item) => item.learner_id),
    questions: questions.map((question) => ({ id: question.id, question: question.question_text, section: question.section, options: options.filter((option) => option.question_id === question.id).sort((a, b) => a.option_order - b.option_order).map((option) => option.option_text), ...(includeAnswers ? { answer: question.answer_key } : {}) })),
  }
}

async function authenticate(request, response, next) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '')
    request.user = jwt.verify(token, jwtSecret)
    const [users] = await pool.query('SELECT id,name,email,role FROM users WHERE id = ?', [request.user.id])
    if (!users[0]) return response.status(401).json({ message: 'Session is no longer valid.' })
    request.user = users[0]
    return next()
  } catch {
    return response.status(401).json({ message: 'Authentication required.' })
  }
}

const requireRole = (...roles) => (request, response, next) => roles.includes(request.user.role) ? next() : response.status(403).json({ message: 'You do not have permission to access this resource.' })

function validateTest(body) {
  if (!body?.title || !body.description || !body.categoryId || !Number.isInteger(body.durationSeconds) || body.durationSeconds < 60 || !Array.isArray(body.questions) || !body.questions.length) return 'Title, description, categoryId, durationSeconds, and questions are required.'
  if (body.questions.some((question) => !question.question || !Array.isArray(question.options) || question.options.length < 2 || !question.options.includes(question.answer))) return 'Every question must include options and a valid answer.'
  return null
}

const cleanCell = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()
const normalizeHeader = (value) => cleanCell(value).toLowerCase().replace(/[^a-z0-9]/g, '')

function parseExcelQuestions(workbook) {
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    const headerIndex = rawRows.findIndex((row) => {
      const headers = row.map(normalizeHeader)
      return headers.some((value) => value === 'question' || value === 'questiontext') &&
        headers.some((value) => value.includes('optiona')) &&
        headers.some((value) => value.includes('answer'))
    })
    if (headerIndex < 0) continue
    const rows = XLSX.utils.sheet_to_json(sheet, { range: headerIndex, defval: '' })
    const headers = Object.keys(rows[0] || {})
    const findColumn = (names) => headers.find((header) => names.includes(normalizeHeader(header)))
    const sectionColumn = findColumn(['section'])
    const questionColumn = findColumn(['question', 'questiontext'])
    const optionColumns = ['optiona', 'optionb', 'optionc', 'optiond'].map((name) => findColumn([name]))
    const answerColumn = headers.find((header) => normalizeHeader(header).includes('answer'))
    if (!questionColumn || optionColumns.some((column) => !column) || !answerColumn) throw new Error('Excel must contain section, question, option A, option B, option C, option D, and an answer column.')
    return rows.map((row) => {
      const options = optionColumns.map((column) => cleanCell(row[column]))
      const answerKey = cleanCell(row[answerColumn]).toUpperCase().replace(/[^A-D]/g, '').slice(0, 1)
      const answerIndex = answerKey ? answerKey.charCodeAt(0) - 65 : -1
      return { section: cleanCell(row[sectionColumn]), question: cleanCell(row[questionColumn]), options, answer: options[answerIndex] || '' }
    }).filter((item) => item.question && item.options.every(Boolean) && item.answer)
  }
  throw new Error('No question sheet with question, options A-D, and answer columns was found.')
}

app.get('/api/health', async (_request, response, next) => {
  try { await pool.query('SELECT 1'); response.json({ status: 'ok', database: 'mysql' }) } catch (error) { next(error) }
})

app.get('/api/registration-categories', async (_request, response, next) => {
  try {
    const [categories] = await pool.query('SELECT c.id,c.name,c.description FROM categories c INNER JOIN tests t ON t.category_id=c.id AND t.active=TRUE ORDER BY c.name')
    response.json({ categories })
  } catch (error) { next(error) }
})

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const [users] = await pool.query('SELECT id,name,email,role,password_hash FROM users WHERE email = ?', [String(request.body?.email || '').toLowerCase()])
    const user = users[0]
    if (!user || passwordHash(String(request.body?.password || '')) !== user.password_hash) return response.status(401).json({ message: 'Invalid email or password.' })
    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '8h' })
    response.json({ token, user: publicUser(user) })
  } catch (error) { next(error) }
})

app.post('/api/auth/register', async (request, response, next) => {
  try {
    const name = String(request.body?.name || '').trim()
    const fatherName = String(request.body?.fatherName || '').trim()
    const email = String(request.body?.email || '').trim().toLowerCase()
    const phone = String(request.body?.phone || '').replace(/\D/g, '')
    const aadhaarNumber = String(request.body?.aadhaarNumber || '').replace(/\D/g, '')
    const location = String(request.body?.location || '').trim()
    const schoolName = String(request.body?.schoolName || '').trim()
    const categoryId = String(request.body?.categoryId || '').trim()

    if (!name || !fatherName || !email || !phone || !aadhaarNumber || !location || !schoolName || !categoryId) return response.status(400).json({ message: 'All registration fields are required, including your class and stream.' })
    if (!/^\d{10}$/.test(phone)) return response.status(400).json({ message: 'Mobile number must contain exactly 10 digits.' })
    if (!/^\d{12}$/.test(aadhaarNumber)) return response.status(400).json({ message: 'Aadhaar number must contain exactly 12 digits.' })

    const [existing] = await pool.query('SELECT email,phone,aadhaar_number FROM users WHERE email = ? OR phone = ? OR aadhaar_number = ?', [email, phone, aadhaarNumber])
    if (existing[0]?.email === email) return response.status(409).json({ message: 'A learner with this email already exists.' })
    if (existing[0]?.phone === phone) return response.status(409).json({ message: 'This mobile number is already registered.' })
    if (existing[0]?.aadhaar_number === aadhaarNumber) return response.status(409).json({ message: 'This Aadhaar number is already registered.' })

    const userId = crypto.randomUUID()
    const user = { id: userId, name, email, role: 'learner' }
    await withTransaction(async (connection) => {
      await connection.query('INSERT INTO users (id,name,father_name,email,phone,aadhaar_number,location,school_name,category_id,password_hash,role) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [userId, name, fatherName, email, phone, aadhaarNumber, location, schoolName, categoryId, passwordHash(crypto.randomBytes(32).toString('hex')), user.role])
      const [[activeTest]] = await connection.query('SELECT id FROM tests WHERE active=TRUE AND category_id=? ORDER BY created_at LIMIT 1', [categoryId])
      if (!activeTest) throw new Error('No active assessment is available for registration.')
      await connection.query('INSERT INTO test_assignments (test_id,learner_id) VALUES (?,?)', [activeTest.id, userId])
    })

    const token = jwt.sign({ id: userId, role: 'learner' }, jwtSecret, { expiresIn: '8h' })
    response.status(201).json({ token, user: publicUser(user) })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ message: 'This email, mobile number, or Aadhaar number is already registered.' })
    next(error)
  }
})

app.get('/api/auth/me', authenticate, (request, response) => response.json({ user: publicUser(request.user) }))

app.get('/api/learner/active-test', authenticate, requireRole('learner'), async (request, response, next) => {
  try {
    const [rows] = await pool.query('SELECT t.id FROM tests t INNER JOIN test_assignments a ON a.test_id=t.id WHERE t.active=TRUE AND a.learner_id=? LIMIT 1', [request.user.id])
    if (!rows[0]) return response.status(404).json({ message: 'There is no assessment assigned to you.' })
    const [attempts] = await pool.query('SELECT id FROM attempts WHERE test_id=? AND learner_id=?', [rows[0].id, request.user.id])
    if (attempts[0]) return response.status(409).json({ message: 'This assessment has already been completed.' })
    response.json({ test: await getTest(rows[0].id), user: publicUser(request.user) })
  } catch (error) { next(error) }
})

app.post('/api/attempts/:testId', authenticate, requireRole('learner'), async (request, response, next) => {
  try {
    const test = await getTest(request.params.testId, true)
    if (!test || !test.active || !test.assignedLearners.includes(request.user.id)) return response.status(404).json({ message: 'Assessment not found.' })
    const submitted = request.body?.answers
    if (!submitted || typeof submitted !== 'object' || Array.isArray(submitted)) return response.status(400).json({ message: 'Answers must be provided.' })
    const result = await withTransaction(async (connection) => {
      const [existing] = await connection.query('SELECT id FROM attempts WHERE test_id=? AND learner_id=? FOR UPDATE', [test.id, request.user.id])
      if (existing[0]) return false
      const attemptId = crypto.randomUUID()
      let score = 0
      const answers = []
      test.questions.forEach((question, index) => {
        const answer = typeof submitted[index] === 'string' && question.options.includes(submitted[index]) ? submitted[index] : ''
        const correct = answer === question.answer
        if (correct) score += 1
        answers.push([attemptId, question.id, answer, correct])
      })
      await connection.query('INSERT INTO attempts (id,test_id,learner_id,score,total_questions) VALUES (?,?,?,?,?)', [attemptId, test.id, request.user.id, score, test.questions.length])
      await connection.query('INSERT INTO attempt_answers (attempt_id,question_id,answer_text,is_correct) VALUES ?', [answers])
      return true
    })
    if (!result) return response.status(409).json({ message: 'This assessment has already been submitted.' })
    response.status(201).json({ submitted: true, message: 'Assessment submitted successfully.' })
  } catch (error) { next(error) }
})

app.post('/api/feedback', authenticate, requireRole('learner'), async (request, response, next) => {
  try {
    const { testId, rating, comment = '' } = request.body || {}
    if (!testId || !Number.isInteger(rating) || rating < 1 || rating > 5) return response.status(400).json({ message: 'A rating from 1 to 5 is required.' })
    await pool.query('INSERT INTO feedback (id,test_id,learner_id,rating,comment) VALUES (?,?,?,?,?)', [crypto.randomUUID(), testId, request.user.id, rating, String(comment).slice(0, 2000)])
    response.status(201).json({ submitted: true })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ message: 'Feedback has already been submitted.' })
    next(error)
  }
})

app.post('/api/attempts/:testId/events', authenticate, requireRole('learner'), async (request, response, next) => {
  try {
    const allowed = ['tab_hidden', 'window_blur', 'fullscreen_exit', 'copy_attempt', 'paste_attempt', 'context_menu']
    if (!allowed.includes(request.body?.eventType)) return response.status(400).json({ message: 'Invalid exam event.' })
    await pool.query('INSERT INTO exam_events (test_id,learner_id,event_type,metadata) VALUES (?,?,?,?)', [request.params.testId, request.user.id, request.body.eventType, JSON.stringify(request.body.metadata || {})])
    response.status(201).json({ recorded: true })
  } catch (error) { next(error) }
})

app.get('/api/admin/dashboard', authenticate, requireRole('admin'), async (_request, response, next) => {
  try {
    const [[stats]] = await pool.query('SELECT (SELECT COUNT(*) FROM users WHERE role="learner") learners, (SELECT COUNT(*) FROM tests) tests, (SELECT COUNT(*) FROM attempts) attempts, (SELECT COUNT(*) FROM feedback) feedback')
    response.json({ stats })
  } catch (error) { next(error) }
})

app.get('/api/admin/learners', authenticate, requireRole('admin'), async (_request, response, next) => {
  try { const [learners] = await pool.query('SELECT id,name,father_name,email,phone,aadhaar_number,location,school_name,created_at FROM users WHERE role="learner" ORDER BY created_at DESC'); response.json({ learners }) } catch (error) { next(error) }
})

app.get('/api/admin/categories', authenticate, requireRole('admin'), async (_request, response, next) => {
  try { const [categories] = await pool.query('SELECT id,name,description,created_at FROM categories ORDER BY name'); response.json({ categories }) } catch (error) { next(error) }
})

app.post('/api/admin/categories', authenticate, requireRole('admin'), async (request, response, next) => {
  try {
    if (!request.body?.name?.trim()) return response.status(400).json({ message: 'Category name is required.' })
    const category = { id: crypto.randomUUID(), name: request.body.name.trim(), description: String(request.body.description || '').trim() }
    await pool.query('INSERT INTO categories (id,name,description) VALUES (?,?,?)', [category.id, category.name, category.description])
    response.status(201).json({ category })
  } catch (error) { if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ message: 'Category already exists.' }); next(error) }
})

app.patch('/api/admin/categories/:categoryId', authenticate, requireRole('admin'), async (request, response, next) => {
  try {
    const [result] = await pool.query('UPDATE categories SET name=COALESCE(?,name),description=COALESCE(?,description) WHERE id=?', [request.body?.name?.trim() || null, request.body?.description, request.params.categoryId])
    if (!result.affectedRows) return response.status(404).json({ message: 'Category not found.' })
    const [[category]] = await pool.query('SELECT id,name,description FROM categories WHERE id=?', [request.params.categoryId])
    response.json({ category })
  } catch (error) { if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ message: 'Category already exists.' }); next(error) }
})

app.delete('/api/admin/categories/:categoryId', authenticate, requireRole('admin'), async (request, response, next) => {
  try { const [result] = await pool.query('DELETE FROM categories WHERE id=?', [request.params.categoryId]); if (!result.affectedRows) return response.status(404).json({ message: 'Category not found.' }); response.status(204).end() } catch (error) { if (error.code === 'ER_ROW_IS_REFERENCED_2') return response.status(409).json({ message: 'Category is used by an exam.' }); next(error) }
})

app.get('/api/admin/tests', authenticate, requireRole('admin'), async (_request, response, next) => {
  try { const [rows] = await pool.query('SELECT id FROM tests ORDER BY created_at DESC'); response.json({ tests: await Promise.all(rows.map((row) => getTest(row.id, true))) }) } catch (error) { next(error) }
})

app.post('/api/admin/tests', authenticate, requireRole('admin'), async (request, response, next) => {
  try {
    const validationError = !request.body?.title || !request.body.description || !request.body.categoryId || !Number.isInteger(request.body.durationSeconds) || request.body.durationSeconds < 60 ? 'Title, description, categoryId, and durationSeconds are required.' : null
    if (validationError) return response.status(400).json({ message: validationError })
    const testId = crypto.randomUUID()
    await withTransaction(async (connection) => {
      if (request.body.active) await connection.query('UPDATE tests SET active=FALSE WHERE category_id=?', [request.body.categoryId])
      await connection.query('INSERT INTO tests (id,title,description,category_id,duration_seconds,active,created_by) VALUES (?,?,?,?,?,?,?)', [testId, request.body.title.trim(), request.body.description.trim(), request.body.categoryId, request.body.durationSeconds, Boolean(request.body.active), request.user.id])
      for (const [index, item] of (request.body.questions || []).entries()) {
        const questionId = crypto.randomUUID()
        await connection.query('INSERT INTO questions (id,test_id,question_text,question_order,answer_key) VALUES (?,?,?,?,?)', [questionId, testId, item.question.trim(), index, item.answer])
        await connection.query('INSERT INTO question_options (question_id,option_text,option_order) VALUES ?', [item.options.map((option, order) => [questionId, String(option), order])])
      }
      for (const learnerId of request.body.assignedLearners || []) await connection.query('INSERT INTO test_assignments (test_id,learner_id) SELECT ?,id FROM users WHERE id=? AND role="learner"', [testId, learnerId])
    })
    response.status(201).json({ test: await getTest(testId, true) })
  } catch (error) { next(error) }
})

app.post('/api/admin/tests/:testId/questions', authenticate, requireRole('admin'), upload.single('file'), async (request, response, next) => {
  try {
    if (!request.file) return response.status(400).json({ message: 'An Excel file is required.' })
    const workbook = XLSX.read(request.file.buffer, { type: 'buffer' })
    let questions
    try {
      questions = parseExcelQuestions(workbook)
    } catch (parseError) {
      return response.status(400).json({ message: parseError.message })
    }
    const validationError = validateTest({ title: 'upload', description: 'upload', categoryId: 'upload', durationSeconds: 60, questions })
    if (validationError) return response.status(400).json({ message: `Excel format error: ${validationError}. Expected question, option 1, option 2, option 3, option 4, answer.` })
    const [[test]] = await pool.query('SELECT id FROM tests WHERE id=?', [request.params.testId])
    if (!test) return response.status(404).json({ message: 'Test not found.' })
    await withTransaction(async (connection) => {
      const [[order]] = await connection.query('SELECT COALESCE(MAX(question_order),-1)+1 next_order FROM questions WHERE test_id=?', [request.params.testId])
      for (const [index, item] of questions.entries()) {
        const questionId = crypto.randomUUID()
        await connection.query('INSERT INTO questions (id,test_id,question_text,section,question_order,answer_key) VALUES (?,?,?,?,?,?)', [questionId, request.params.testId, item.question, item.section, order.next_order + index, item.answer])
        await connection.query('INSERT INTO question_options (question_id,option_text,option_order) VALUES ?', [item.options.map((option, optionIndex) => [questionId, String(option), optionIndex])])
      }
    })
    response.status(201).json({ added: questions.length })
  } catch (error) { next(error) }
})

app.post('/api/admin/tests/:testId/questions/manual', authenticate, requireRole('admin'), async (request, response, next) => {
  try {
    const validationError = validateTest({ title: 'manual', description: 'manual', categoryId: 'manual', durationSeconds: 60, questions: [request.body] })
    if (validationError) return response.status(400).json({ message: validationError })
    const [[order]] = await pool.query('SELECT COALESCE(MAX(question_order),-1)+1 next_order FROM questions WHERE test_id=?', [request.params.testId])
    const questionId = crypto.randomUUID()
    await pool.query('INSERT INTO questions (id,test_id,question_text,section,question_order,answer_key) VALUES (?,?,?,?,?,?)', [questionId, request.params.testId, request.body.question, String(request.body.section || '').trim(), order.next_order, request.body.answer])
    await pool.query('INSERT INTO question_options (question_id,option_text,option_order) VALUES ?', [request.body.options.map((option, index) => [questionId, option, index])])
    response.status(201).json({ added: 1 })
  } catch (error) { next(error) }
})

app.patch('/api/admin/tests/:testId', authenticate, requireRole('admin'), async (request, response, next) => {
  try {
    if (request.body.active === true) {
      const [[test]] = await pool.query('SELECT category_id FROM tests WHERE id=?', [request.params.testId])
      if (test) await pool.query('UPDATE tests SET active=FALSE WHERE category_id=?', [test.category_id])
    }
    const fields = []; const values = []
    for (const field of ['title', 'description', 'category_id', 'duration_seconds', 'active']) if (request.body[field] !== undefined) { fields.push(`${field}=?`); values.push(request.body[field]) }
    if (fields.length) { values.push(request.params.testId); const [result] = await pool.query(`UPDATE tests SET ${fields.join(',')} WHERE id=?`, values); if (!result.affectedRows) return response.status(404).json({ message: 'Test not found.' }) }
    if (Array.isArray(request.body.assignedLearners)) { await pool.query('DELETE FROM test_assignments WHERE test_id=?', [request.params.testId]); for (const learnerId of request.body.assignedLearners) await pool.query('INSERT INTO test_assignments (test_id,learner_id) SELECT ?,id FROM users WHERE id=? AND role="learner"', [request.params.testId, learnerId]) }
    response.json({ test: await getTest(request.params.testId, true) })
  } catch (error) { next(error) }
})

app.patch('/api/admin/tests/:testId/questions/:questionId', authenticate, requireRole('admin'), async (request, response, next) => {
  try {
    const { question, section, options, answer } = request.body || {}
    if (!question?.trim() || !Array.isArray(options) || options.length !== 4 || options.some((option) => !String(option).trim()) || !options.includes(answer)) return response.status(400).json({ message: 'Question, four options, and a valid answer are required.' })
    const [[existing]] = await pool.query('SELECT id FROM questions WHERE id=? AND test_id=?', [request.params.questionId, request.params.testId])
    if (!existing) return response.status(404).json({ message: 'Question not found.' })
    await withTransaction(async (connection) => {
      await connection.query('UPDATE questions SET question_text=?,section=?,answer_key=? WHERE id=? AND test_id=?', [question.trim(), String(section || '').trim(), answer, request.params.questionId, request.params.testId])
      await connection.query('UPDATE question_options SET option_text=? WHERE question_id=? AND option_order=?', [options[0], request.params.questionId, 0])
      await connection.query('UPDATE question_options SET option_text=? WHERE question_id=? AND option_order=?', [options[1], request.params.questionId, 1])
      await connection.query('UPDATE question_options SET option_text=? WHERE question_id=? AND option_order=?', [options[2], request.params.questionId, 2])
      await connection.query('UPDATE question_options SET option_text=? WHERE question_id=? AND option_order=?', [options[3], request.params.questionId, 3])
    })
    response.json({ test: await getTest(request.params.testId, true) })
  } catch (error) { next(error) }
})

app.delete('/api/admin/tests/:testId/questions/:questionId', authenticate, requireRole('admin'), async (request, response, next) => {
  try {
    const [result] = await pool.query('DELETE FROM questions WHERE id=? AND test_id=?', [request.params.questionId, request.params.testId])
    if (!result.affectedRows) return response.status(404).json({ message: 'Question not found.' })
    response.status(204).end()
  } catch (error) { next(error) }
})

app.delete('/api/admin/tests/:testId', authenticate, requireRole('admin'), async (request, response, next) => {
  try { const [result] = await pool.query('DELETE FROM tests WHERE id=?', [request.params.testId]); if (!result.affectedRows) return response.status(404).json({ message: 'Test not found.' }); response.status(204).end() } catch (error) { next(error) }
})

app.get('/api/admin/results', authenticate, requireRole('admin'), async (_request, response, next) => {
  try { const [results] = await pool.query('SELECT a.id,a.score,a.total_questions,a.submitted_at,t.title test_title,u.name learner_name,u.email learner_email FROM attempts a JOIN tests t ON t.id=a.test_id JOIN users u ON u.id=a.learner_id ORDER BY a.submitted_at DESC'); response.json({ results }) } catch (error) { next(error) }
})

app.get('/api/admin/monitoring', authenticate, requireRole('admin'), async (_request, response, next) => {
  try {
    const [events] = await pool.query('SELECT e.id,e.event_type,e.occurred_at,u.name learner_name,u.email learner_email,t.title test_title FROM exam_events e JOIN users u ON u.id=e.learner_id JOIN tests t ON t.id=e.test_id ORDER BY e.occurred_at DESC')
    response.json({ events })
  } catch (error) { next(error) }
})

app.get('/api/admin/feedback', authenticate, requireRole('admin'), async (_request, response, next) => {
  try { const [feedback] = await pool.query('SELECT f.id,f.rating,f.comment,f.submitted_at,t.title test_title,u.name learner_name,u.email learner_email FROM feedback f JOIN tests t ON t.id=f.test_id JOIN users u ON u.id=f.learner_id ORDER BY f.submitted_at DESC'); response.json({ feedback }) } catch (error) { next(error) }
})

app.use((error, _request, response, _next) => { console.error(error); response.status(500).json({ message: 'An unexpected server error occurred.' }) })

ensureSchemaCompatibility()
  .then(() => app.listen(port, () => console.log(`Online test API running on http://localhost:${port}`)))
  .catch((error) => {
    console.error('Database schema compatibility check failed.', error)
    process.exitCode = 1
  })
