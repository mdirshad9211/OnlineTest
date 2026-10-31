import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../components/Icon'

function request(token, path, options = {}) {
  return fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  })
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const payload = await response.json()
    if (!response.ok) return setError(payload.message)
    localStorage.setItem('quizly_token', payload.token)
    localStorage.setItem('quizly_user', JSON.stringify(payload.user))
    onLogin(payload)
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <form onSubmit={submit} className="rounded border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-500">Manage categories, exams, questions, results and monitoring.</p>
        <input className="mt-6 w-full rounded border border-slate-300 p-2.5 text-sm" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" required />
        <input className="mt-3 w-full rounded border border-slate-300 p-2.5 text-sm" value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" required />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button className="mt-4 w-full rounded-lg bg-tutor-green py-2.5 text-sm font-semibold text-white">Sign in</button>
      </form>
    </div>
  )
}

function AdminPanel({ token, user, onLogout }) {
  const [section, setSection] = useState('overview')
  const [collapsed, setCollapsed] = useState(false)
  const [stats, setStats] = useState({})
  const [tests, setTests] = useState([])
  const [categories, setCategories] = useState([])
  const [learners, setLearners] = useState([])
  const [results, setResults] = useState([])
  const [feedback, setFeedback] = useState([])
  const [events, setEvents] = useState([])
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    const responses = await Promise.all([
      request(token, '/admin/dashboard'),
      request(token, '/admin/tests'),
      request(token, '/admin/results'),
      request(token, '/admin/feedback'),
      request(token, '/admin/monitoring'),
      request(token, '/admin/learners'),
    ])
    const payloads = await Promise.all(responses.map((response) => response.json()))
    setStats(payloads[0].stats || {})
    setTests(payloads[1].tests || [])
    setResults(payloads[2].results || [])
    setFeedback(payloads[3].feedback || [])
    setEvents(payloads[4].events || [])
    setLearners(payloads[5].learners || [])

    const categoryResponse = await request(token, '/admin/categories')
    setCategories((await categoryResponse.json()).categories || [])
  }, [token])

  useEffect(() => {
    const timer = setTimeout(load, 0)
    return () => clearTimeout(timer)
  }, [load])

  const createCategory = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const response = await request(token, '/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name: form.get('name'), description: form.get('description') }),
    })
    const payload = await response.json().catch(() => ({}))
    setNotice(response.ok ? 'Category created.' : payload.message || 'Could not create category.')
    event.currentTarget.reset()
    load()
  }

  const deleteCategory = async (id) => {
    const response = await request(token, `/admin/categories/${id}`, { method: 'DELETE' })
    const payload = await response.json().catch(() => ({}))
    setNotice(response.ok ? 'Category deleted.' : payload.message || 'Could not delete category.')
    load()
  }

  const navItems = [
    ['overview', 'Overview', 'home'],
    ['categories', 'Categories', 'folder'],
    ['tests', 'Exams', 'clipboard'],
    ['results', 'Results', 'chart'],
    ['monitoring', 'Monitoring', 'shield'],
    ['feedback', 'Feedback', 'message'],
  ]

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className={`${collapsed ? 'w-20' : 'w-72'} border-r border-slate-200 bg-white transition-all duration-200`}>
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            {!collapsed && <a href="/" className="flex items-center gap-2 rounded-lg text-base font-bold tracking-tight text-slate-900 outline-none focus-visible:ring-4 focus-visible:ring-tutor-sage/30" aria-label="Go to TutorX home"><img src="/TutorX%20Logo.png" alt="TutorX" className="h-8 w-auto object-contain" />TutorX Admin</a>}
            <button onClick={() => setCollapsed((value) => !value)} className="grid h-8 w-8 place-items-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50">
              {collapsed ? '→' : '←'}
            </button>
          </div>

          <nav className="space-y-2 p-3">
            {navItems.map(([key, label, icon]) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm font-medium transition ${
                  section === key ? 'bg-tutor-green text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-slate-100 text-slate-700"><Icon name={icon} size={16} /></span>
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-slate-200 p-4">
            {!collapsed && (
              <div className="rounded bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Signed in</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{user.name}</p>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Administration</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">Exam control panel</h1>
              </div>
              <button onClick={onLogout} className="rounded border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Sign out</button>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-5 py-8">
            {notice && <p className="mb-5 rounded border border-slate-200 bg-white p-3 text-sm text-slate-600">{notice}</p>}

            {section === 'overview' && <Overview stats={stats} tests={tests} />}
            {section === 'categories' && <CategoryManager categories={categories} onCreate={createCategory} onDelete={deleteCategory} />}
            {section === 'tests' && <ExamManager token={token} tests={tests} categories={categories} learners={learners} onSaved={load} onNotice={setNotice} />}
            {section === 'results' && <DataTable title="Student results" headers={['Student', 'Exam', 'Score', 'Submitted']} rows={results.map((item) => [item.learner_name, item.test_title, `${item.score}/${item.total_questions}`, item.submitted_at])} />}
            {section === 'monitoring' && <DataTable title="Exam monitoring events" headers={['Student', 'Exam', 'Event', 'Time']} rows={events.map((item) => [item.learner_name, item.test_title, item.event_type, item.occurred_at])} />}
            {section === 'feedback' && <DataTable title="Student feedback" headers={['Student', 'Exam', 'Rating', 'Comment']} rows={feedback.map((item) => [item.learner_name, item.test_title, `${item.rating}/5`, item.comment || '—'])} />}
          </div>
        </main>
      </div>
    </div>
  )
}

function Overview({ stats, tests }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Learners', stats.learners, 'users'],
          ['Exams', stats.tests, 'clipboard'],
          ['Attempts', stats.attempts, 'target'],
          ['Feedback', stats.feedback, 'message'],
        ].map(([label, value, icon]) => (
          <div key={label} className="rounded border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><span className="grid h-9 w-9 place-items-center rounded bg-slate-100 text-slate-700"><Icon name={icon} size={18} /></span></div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value ?? '—'}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Current active exam</h2>
        <p className="mt-2 text-sm text-slate-500">{tests.find((test) => test.active)?.title || 'No active exam'}</p>
      </div>
    </>
  )
}

function CategoryManager({ categories, onCreate, onDelete }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <form onSubmit={onCreate} className="rounded border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Create category</h2>
        <input name="name" className="mt-4 w-full rounded border border-slate-300 p-2.5 text-sm" placeholder="Category name" required />
        <textarea name="description" className="mt-3 w-full rounded border border-slate-300 p-2.5 text-sm" placeholder="Description" rows="3" />
        <button className="mt-3 w-full rounded-lg bg-tutor-green py-2.5 text-sm font-semibold text-white">Add category</button>
      </form>
      <DataTable
        title="Exam categories"
        headers={['Name', 'Description', 'Action']}
        rows={categories.map((category) => [category.name, category.description || '—', <button key={category.id} onClick={() => onDelete(category.id)} className="text-red-600">Delete</button>])}
      />
    </div>
  )
}

function ExamManager({ token, tests, categories, learners, onSaved, onNotice }) {
  const [selectedTest, setSelectedTest] = useState('')
  const [manual, setManual] = useState({ question: '', option1: '', option2: '', option3: '', option4: '', answer: '' })

  const createExam = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const response = await request(token, '/admin/tests', {
      method: 'POST',
      body: JSON.stringify({
        title: form.get('title'),
        description: form.get('description'),
        categoryId: form.get('categoryId'),
        durationSeconds: Number(form.get('durationSeconds')),
        active: form.get('active') === 'on',
        assignedLearners: form.getAll('assignedLearners'),
        questions: [],
      }),
    })
    const payload = await response.json().catch(() => ({}))
    onNotice(response.ok ? 'Exam created. Add questions next.' : payload.message || 'Could not create exam.')
    event.currentTarget.reset()
    onSaved()
  }

  const addManual = async (event) => {
    event.preventDefault()
    const response = await request(token, `/admin/tests/${selectedTest}/questions/manual`, {
      method: 'POST',
      body: JSON.stringify({
        question: manual.question,
        options: [manual.option1, manual.option2, manual.option3, manual.option4],
        answer: manual.answer,
      }),
    })
    const payload = await response.json().catch(() => ({}))
    onNotice(response.ok ? 'Question added.' : payload.message || 'Could not add question.')
    setManual({ question: '', option1: '', option2: '', option3: '', option4: '', answer: '' })
    onSaved()
  }

  const upload = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const response = await request(token, `/admin/tests/${selectedTest}/questions`, { method: 'POST', body: formData })
    const payload = await response.json().catch(() => ({}))
    onNotice(response.ok ? `Added ${payload.added || 0} questions.` : payload.message || 'Could not upload questions.')
    onSaved()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createExam} className="rounded border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Create exam</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="title" className="rounded border border-slate-300 p-2.5 text-sm" placeholder="Exam title" required />
          <select name="categoryId" className="rounded border border-slate-300 p-2.5 text-sm" required>
            <option value="">Select category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <textarea name="description" className="rounded border border-slate-300 p-2.5 text-sm" placeholder="Description" required />
          <input name="durationSeconds" type="number" min="60" defaultValue="1500" className="rounded border border-slate-300 p-2.5 text-sm" placeholder="Duration in seconds" required />
          <select name="assignedLearners" multiple className="min-h-28 rounded border border-slate-300 p-2.5 text-sm md:col-span-2" aria-label="Assign learners">
            {learners.length ? learners.map((learner) => <option key={learner.id} value={learner.id}>{learner.name} ({learner.email})</option>) : <option disabled>No learners registered yet</option>}
          </select>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input name="active" type="checkbox" /> Make active exam
        </label>
        <button className="mt-4 rounded-lg bg-tutor-green px-5 py-2.5 text-sm font-semibold text-white">Create exam</button>
      </form>

      <div className="rounded border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Question tools</h2>
        <select value={selectedTest} onChange={(event) => setSelectedTest(event.target.value)} className="mt-4 w-full rounded border border-slate-300 p-2.5 text-sm">
          <option value="">Select an exam</option>
          {tests.map((test) => <option key={test.id} value={test.id}>{test.title}</option>)}
        </select>

        {selectedTest && (
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <form onSubmit={upload} className="rounded border border-dashed border-slate-300 p-4">
              <h3 className="font-semibold text-slate-900">Upload Excel questions</h3>
              <p className="mt-1 text-xs text-slate-500">Columns: question, option 1, option 2, option 3, option 4, answer</p>
              <input name="file" type="file" accept=".xlsx,.xls" className="mt-4 text-sm" required />
              <button className="mt-4 rounded-lg bg-tutor-green px-4 py-2 text-sm font-semibold text-white">Upload questions</button>
            </form>

            <form onSubmit={addManual} className="rounded border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">Add question manually</h3>
              <input value={manual.question} onChange={(event) => setManual({ ...manual, question: event.target.value })} className="mt-3 w-full rounded border border-slate-300 p-2 text-sm" placeholder="Question" required />
              {[1, 2, 3, 4].map((number) => (
                <input
                  key={number}
                  value={manual[`option${number}`]}
                  onChange={(event) => setManual({ ...manual, [`option${number}`]: event.target.value })}
                  className="mt-2 w-full rounded border border-slate-300 p-2 text-sm"
                  placeholder={`Option ${number}`}
                  required
                />
              ))}
              <input value={manual.answer} onChange={(event) => setManual({ ...manual, answer: event.target.value })} className="mt-2 w-full rounded border border-slate-300 p-2 text-sm" placeholder="Correct answer (exact option text)" required />
              <button className="mt-3 rounded-lg bg-tutor-green px-4 py-2 text-sm font-semibold text-white">Add question</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function DataTable({ title, headers, rows }) {
  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {headers.map((header) => <th key={header} className="whitespace-nowrap px-5 py-3">{header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.length ? rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-5 py-4 text-slate-700">{cell}</td>)}
              </tr>
            )) : (
              <tr>
                <td colSpan={headers.length} className="px-5 py-8 text-center text-slate-500">No records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminPanelPage() {
  const [token, setToken] = useState(localStorage.getItem('quizly_token'))
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('quizly_user') || 'null'))

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AdminLogin onLogin={(payload) => { setToken(payload.token); setUser(payload.user) }} />
      </div>
    )
  }

  if (user.role !== 'admin') {
    return <div className="p-16 text-center text-slate-700">Admin access required.</div>
  }

  const logout = () => {
    localStorage.clear()
    setToken(null)
    setUser(null)
  }

  return <AdminPanel token={token} user={user} onLogout={logout} />
}
