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
            {section === 'categories' && <CategoryManager token={token} categories={categories} onCreate={createCategory} onDelete={deleteCategory} onSaved={load} onNotice={setNotice} />}
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

function CategoryManager({ token, categories, onCreate, onDelete, onSaved, onNotice }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const openEdit = (category) => { setEditing(category); setForm({ name: category.name, description: category.description || '' }) }
  const saveEdit = async (event) => {
    event.preventDefault()
    const response = await request(token, `/admin/categories/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) })
    const payload = await response.json().catch(() => ({}))
    onNotice(response.ok ? 'Category updated.' : payload.message || 'Could not update category.')
    if (response.ok) setEditing(null)
    onSaved()
  }
  return (
    <>
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
        rows={categories.map((category) => [category.name, category.description || '—', <div key={category.id} className="flex gap-3"><button onClick={() => openEdit(category)} className="text-tutor-green">Edit</button><button onClick={() => onDelete(category.id)} className="text-red-600">Delete</button></div>])}
      />
    </div>
    {editing && <Modal title="Edit category" onClose={() => setEditing(null)}><form onSubmit={saveEdit} className="space-y-4"><label className="block text-sm font-semibold">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2.5" required /></label><label className="block text-sm font-semibold">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2.5" rows="4" /></label><ModalActions onCancel={() => setEditing(null)} submitLabel="Save category" /></form></Modal>}
    </>
  )
}

function ExamManager({ token, tests, categories, learners, onSaved, onNotice }) {
  const [selectedTest, setSelectedTest] = useState('')
  const [manual, setManual] = useState({ question: '', option1: '', option2: '', option3: '', option4: '', answer: '' })
  const [editingExam, setEditingExam] = useState(null)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [examForm, setExamForm] = useState({})
  const [questionForm, setQuestionForm] = useState({})
  const activeTest = tests.find((test) => test.id === selectedTest)

  const editExam = (test) => {
    setEditingExam(test)
    setExamForm({ title: test.title, description: test.description, category_id: test.categoryId, duration_minutes: Math.ceil(test.durationSeconds / 60), active: test.active })
  }

  const saveExam = async (event) => {
    event.preventDefault()
    const response = await request(token, `/admin/tests/${editingExam.id}`, { method: 'PATCH', body: JSON.stringify({ ...examForm, duration_seconds: Number(examForm.duration_minutes) * 60 }) })
    const payload = await response.json().catch(() => ({}))
    onNotice(response.ok ? 'Exam updated.' : payload.message || 'Could not update exam.')
    if (response.ok) setEditingExam(null)
    onSaved()
  }

  const toggleExam = async (test) => {
    const response = await request(token, `/admin/tests/${test.id}`, { method: 'PATCH', body: JSON.stringify({ active: !test.active }) })
    const payload = await response.json().catch(() => ({}))
    onNotice(response.ok ? `Exam ${test.active ? 'deactivated' : 'activated'}.` : payload.message || 'Could not update exam.')
    onSaved()
  }

  const deleteExam = async (test) => {
    if (!window.confirm(`Delete "${test.title}" and all its questions?`)) return
    const response = await request(token, `/admin/tests/${test.id}`, { method: 'DELETE' })
    const payload = await response.json().catch(() => ({}))
    onNotice(response.ok ? 'Exam deleted.' : payload.message || 'Could not delete exam.')
    if (selectedTest === test.id) setSelectedTest('')
    onSaved()
  }

  const editQuestion = (test, question) => {
    setEditingQuestion({ testId: test.id, question })
    setQuestionForm({ question: question.question, section: question.section || '', options: [...question.options], answer: question.answer })
  }

  const saveQuestion = async (event) => {
    event.preventDefault()
    const response = await request(token, `/admin/tests/${editingQuestion.testId}/questions/${editingQuestion.question.id}`, { method: 'PATCH', body: JSON.stringify(questionForm) })
    const payload = await response.json().catch(() => ({}))
    onNotice(response.ok ? 'Question updated.' : payload.message || 'Could not update question.')
    if (response.ok) setEditingQuestion(null)
    onSaved()
  }

  const deleteQuestion = async (test, question) => {
    if (!window.confirm(`Delete this question?\n\n${question.question}`)) return
    const response = await request(token, `/admin/tests/${test.id}/questions/${question.id}`, { method: 'DELETE' })
    const payload = await response.json().catch(() => ({}))
    onNotice(response.ok ? 'Question deleted.' : payload.message || 'Could not delete question.')
    onSaved()
  }

  const createExam = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const response = await request(token, '/admin/tests', {
      method: 'POST',
      body: JSON.stringify({
        title: form.get('title'),
        description: form.get('description'),
        categoryId: form.get('categoryId'),
        durationSeconds: Number(form.get('durationMinutes')) * 60,
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
        section: manual.section,
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
    <>
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
          <label className="text-sm font-semibold">Duration (minutes)<input name="durationMinutes" type="number" min="1" defaultValue="25" className="rounded border border-slate-300 p-2.5 text-sm" placeholder="Duration in minutes" required /></label>
          <select name="assignedLearners" multiple className="min-h-28 rounded border border-slate-300 p-2.5 text-sm md:col-span-2" aria-label="Assign learners">
            {learners.length ? learners.map((learner) => <option key={learner.id} value={learner.id}>{learner.name}</option>) : <option disabled>No learners registered yet</option>}
          </select>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input name="active" type="checkbox" /> Make active exam
        </label>
        <button className="mt-4 rounded-lg bg-tutor-green px-5 py-2.5 text-sm font-semibold text-white">Create exam</button>
      </form>

      <DataTable
        title="Existing exams"
        headers={['Exam', 'Category', 'Questions', 'Status', 'Actions']}
        rows={tests.map((test) => [test.title, test.categoryName, test.questions.length, test.active ? 'Active' : 'Inactive', <div key={test.id} className="flex flex-wrap gap-3"><button onClick={() => editExam(test)} className="text-tutor-green">Edit</button><button onClick={() => toggleExam(test)} className="text-slate-600">{test.active ? 'Make inactive' : 'Make active'}</button><button onClick={() => deleteExam(test)} className="text-red-600">Delete</button></div>])}
      />

      <div className="rounded border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Question tools</h2>
        <select value={selectedTest} onChange={(event) => setSelectedTest(event.target.value)} className="mt-4 w-full rounded border border-slate-300 p-2.5 text-sm">
          <option value="">Select an exam</option>
          {tests.map((test) => <option key={test.id} value={test.id}>{test.title}</option>)}
        </select>

        {selectedTest && (
          <div className="mt-5 grid gap-6">
            <div className="rounded border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">Questions ({activeTest?.questions.length || 0})</h3>
              <div className="mt-3 divide-y divide-slate-100">{activeTest?.questions.map((question, index) => <div key={question.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-slate-800">Q{index + 1}. {question.question}</p><p className="text-xs text-slate-500">{question.section || 'No section'} · Answer: {question.answer}</p></div><div className="flex gap-3"><button onClick={() => editQuestion(activeTest, question)} className="text-tutor-green">Edit</button><button onClick={() => deleteQuestion(activeTest, question)} className="text-red-600">Delete</button></div></div>)}</div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={upload} className="rounded border border-dashed border-slate-300 p-4">
              <h3 className="font-semibold text-slate-900">Upload Excel questions</h3>
              <p className="mt-1 text-xs text-slate-500">Columns: Section, Question, Option A, Option B, Option C, Option D, Answer key</p>
              <input name="file" type="file" accept=".xlsx,.xls" className="mt-4 text-sm" required />
              <button className="mt-4 rounded-lg bg-tutor-green px-4 py-2 text-sm font-semibold text-white">Upload questions</button>
            </form>

            <form onSubmit={addManual} className="rounded border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">Add question manually</h3>
              <input value={manual.question} onChange={(event) => setManual({ ...manual, question: event.target.value })} className="mt-3 w-full rounded border border-slate-300 p-2 text-sm" placeholder="Question" required />
              <input value={manual.section || ''} onChange={(event) => setManual({ ...manual, section: event.target.value })} className="mt-2 w-full rounded border border-slate-300 p-2 text-sm" placeholder="Section (optional)" />
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
          </div>
        )}
      </div>
    </div>
    {editingExam && <Modal title="Edit exam" onClose={() => setEditingExam(null)}><form onSubmit={saveExam} className="grid gap-4"><label className="text-sm font-semibold">Title<input value={examForm.title} onChange={(event) => setExamForm({ ...examForm, title: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2.5" required /></label><label className="text-sm font-semibold">Category<select value={examForm.category_id} onChange={(event) => setExamForm({ ...examForm, category_id: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2.5" required>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="text-sm font-semibold">Description<textarea value={examForm.description} onChange={(event) => setExamForm({ ...examForm, description: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2.5" rows="4" required /></label><label className="text-sm font-semibold">Duration (minutes)<input type="number" min="1" value={examForm.duration_minutes} onChange={(event) => setExamForm({ ...examForm, duration_minutes: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2.5" required /></label><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(examForm.active)} onChange={(event) => setExamForm({ ...examForm, active: event.target.checked })} /> Active exam</label><ModalActions onCancel={() => setEditingExam(null)} submitLabel="Save exam" /></form></Modal>}
    {editingQuestion && <Modal title="Edit question" onClose={() => setEditingQuestion(null)}><form onSubmit={saveQuestion} className="grid gap-4"><label className="text-sm font-semibold">Question<textarea value={questionForm.question} onChange={(event) => setQuestionForm({ ...questionForm, question: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2.5" rows="4" required /></label><label className="text-sm font-semibold">Section<input value={questionForm.section} onChange={(event) => setQuestionForm({ ...questionForm, section: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2.5" /></label>{questionForm.options?.map((option, index) => <label key={index} className="text-sm font-semibold">Option {String.fromCharCode(65 + index)}<input value={option} onChange={(event) => setQuestionForm({ ...questionForm, options: questionForm.options.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} className="mt-1 w-full rounded border border-slate-300 p-2.5" required /></label>)}<label className="text-sm font-semibold">Correct answer<select value={questionForm.answer} onChange={(event) => setQuestionForm({ ...questionForm, answer: event.target.value })} className="mt-1 w-full rounded border border-slate-300 p-2.5" required>{questionForm.options?.map((option, index) => <option key={index} value={option}>Option {String.fromCharCode(65 + index)}: {option}</option>)}</select></label><ModalActions onCancel={() => setEditingQuestion(null)} submitLabel="Save question" /></form></Modal>}
    </>
  )
}

function Modal({ title, onClose, children }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-xl font-bold text-slate-900">{title}</h2><button type="button" onClick={onClose} className="rounded px-2 py-1 text-xl text-slate-400 hover:bg-slate-100" aria-label="Close dialog">×</button></div>{children}</div></div>
}

function ModalActions({ onCancel, submitLabel }) {
  return <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button type="submit" className="rounded-lg bg-tutor-green px-4 py-2.5 text-sm font-semibold text-white">{submitLabel}</button></div>
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
