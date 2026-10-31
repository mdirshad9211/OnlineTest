import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'

function authHeaders(token, includeJson = false) {
  return { ...(includeJson ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${token}` }
}

function Header({ user, onRegister, onLogout, isLoggedIn }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-5 px-5 py-3 sm:px-8">
        <a href="/" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-tutor-sage/30" aria-label="Go to TutorX home">
          <img src="/TutorX%20Logo.png" alt="TutorX" className="h-9 w-auto object-contain" />
          <span className="text-lg font-bold tracking-tight text-slate-900">TutorX</span>
        </a>

        {!isLoggedIn && (
          <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            <a href="#why-choose-us" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-tutor-cream hover:text-tutor-green">Why NSAT?</a>
            <a href="#about-us" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-tutor-cream hover:text-tutor-green">How it works</a>
            <a href="#collaborations" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-tutor-cream hover:text-tutor-green">Exam structure</a>
            <a href="#faqs" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-tutor-cream hover:text-tutor-green">FAQs</a>
          </nav>
        )}

        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-slate-600 sm:block">{user?.name || 'Learner'}</span>
            <button onClick={onLogout} className="rounded border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50">Sign out</button>
          </div>
        ) : (
          <button onClick={onRegister} className="rounded-lg bg-tutor-green px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3f5039]">Register</button>
        )}
      </div>
      {!isLoggedIn && (
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-5 py-2 lg:hidden" aria-label="Mobile navigation">
          <a href="#why-choose-us" className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-tutor-cream hover:text-tutor-green">Why NSAT?</a>
          <a href="#about-us" className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-tutor-cream hover:text-tutor-green">How it works</a>
          <a href="#collaborations" className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-tutor-cream hover:text-tutor-green">Exam structure</a>
          <a href="#faqs" className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-tutor-cream hover:text-tutor-green">FAQs</a>
        </nav>
      )}
    </header>
  )
}

function Register({ onRegister }) {
  const [form, setForm] = useState({ name: '', fatherName: '', email: '', phone: '', aadhaarNumber: '', location: '', schoolName: '', categoryId: '' })
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const updateField = (field) => (event) => {
    setForm((value) => ({ ...value, [field]: event.target.value }))
  }

  useEffect(() => {
    fetch('/api/registration-categories')
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.message || 'Could not load class options.')
        setCategories(payload.categories || [])
      })
      .catch((loadError) => setError(loadError.message))
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message || 'Registration failed.')
      localStorage.setItem('quizly_token', payload.token)
      localStorage.setItem('quizly_user', JSON.stringify(payload.user))
      onRegister(payload)
    } catch (registerError) {
      setError(registerError.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-10 sm:px-8 sm:py-16">
      <div className="rounded-2xl border border-[#dfe5dc] bg-white p-6 shadow-lg shadow-[#4d6045]/10 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">NSAT 2026 Registration</h1>
        <p className="mt-2 text-sm text-slate-500">Fill in your details carefully. Your exam will start after registration.</p>
        <form onSubmit={submit} className="mt-7 space-y-5">
          <label className="block text-sm font-semibold text-slate-700" htmlFor="name">Full name
            <input id="name" type="text" placeholder="Enter your full name" value={form.name} onChange={updateField('name')} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-tutor-green focus:bg-white focus:ring-4 focus:ring-tutor-sage/25" required />
          </label>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="father-name">Father name
            <input id="father-name" type="text" placeholder="Enter your father's name" value={form.fatherName} onChange={updateField('fatherName')} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-tutor-green focus:bg-white focus:ring-4 focus:ring-tutor-sage/25" required />
          </label>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="register-email">Email
            <input id="register-email" type="email" placeholder="you@example.com" value={form.email} onChange={updateField('email')} autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-tutor-green focus:bg-white focus:ring-4 focus:ring-tutor-sage/25" required />
          </label>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="phone">Mobile number
            <input id="phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength="10" placeholder="Enter 10-digit mobile number" value={form.phone} onChange={updateField('phone')} autoComplete="tel" className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-tutor-green focus:bg-white focus:ring-4 focus:ring-tutor-sage/25" required />
          </label>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="aadhaar-number">Aadhaar card number
            <input id="aadhaar-number" type="text" inputMode="numeric" pattern="[0-9]{12}" maxLength="12" placeholder="Enter 12-digit Aadhaar number" value={form.aadhaarNumber} onChange={updateField('aadhaarNumber')} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-tutor-green focus:bg-white focus:ring-4 focus:ring-tutor-sage/25" required />
          </label>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="location">Location
            <input id="location" type="text" placeholder="City, district, or town" value={form.location} onChange={updateField('location')} autoComplete="address-level2" className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-tutor-green focus:bg-white focus:ring-4 focus:ring-tutor-sage/25" required />
          </label>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="school-name">School name
            <input id="school-name" type="text" placeholder="Enter your school name" value={form.schoolName} onChange={updateField('schoolName')} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-tutor-green focus:bg-white focus:ring-4 focus:ring-tutor-sage/25" required />
          </label>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="category-id">Class and stream
            <select id="category-id" value={form.categoryId} onChange={updateField('categoryId')} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-tutor-green focus:bg-white focus:ring-4 focus:ring-tutor-sage/25" required>
              <option value="">Select your class and stream</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          <button disabled={submitting} className="w-full rounded-xl bg-tutor-green px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3f5039] disabled:cursor-not-allowed disabled:bg-slate-300">{submitting ? 'Registering...' : 'Register and start exam'}</button>
        </form>
      </div>
    </div>
  )
}

function LoadingState() {
  return <div className="mx-auto max-w-5xl px-5 py-16 text-center text-sm text-slate-500">Loading your assessment...</div>
}

function StudentLanding({ onRegister }) {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-[#dfe5dc] bg-gradient-to-br from-white via-tutor-cream to-[#e9f0e5]">
        <div className="pointer-events-none absolute -right-28 top-12 h-72 w-72 rounded-full bg-tutor-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-tutor-sage/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-tutor-cream px-3 py-1.5 text-sm font-semibold text-tutor-green">🌟 National Scholarship Admission Test (NSAT 2026)</p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">Unlock Up to 100% Scholarship for Offline Coaching &amp; Library Access at The Tutor</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600">Test your preparation, compete with top aspirants, and secure heavy tuition waivers and premium study resources through TutorX.</p>
            <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={onRegister} className="rounded-xl bg-tutor-green px-6 py-3 text-sm font-semibold text-white hover:bg-[#3f5039]">Register</button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-200 pt-5 text-sm font-semibold text-slate-600">
              <span>Up to 100% scholarship</span><span>Offline coaching access</span><span>Premium library resources</span>
            </div>
          </div>
          <div className="rounded-2xl border border-tutor-green bg-tutor-green p-6 text-white shadow-xl shadow-tutor-sage/30">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-white/10 text-tutor-gold"><Icon name="target" size={22} /></span>
              <div><p className="text-sm font-semibold">Your scholarship opportunity</p><p className="mt-1 text-xs text-slate-300">One test can open the door to your next big step.</p></div>
            </div>
            <div className="mt-6 space-y-3">
              {['Compete with ambitious students', 'Earn tuition waivers based on merit', 'Access offline coaching and library facilities'].map((item) => <div key={item} className="flex items-start gap-3 rounded border border-white/10 bg-white/5 p-3 text-sm text-slate-200"><Icon name="check" size={18} className="mt-0.5 shrink-0 text-tutor-gold" />{item}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="why-choose-us" className="scroll-mt-28 w-full bg-white px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-[#dfe5dc] bg-tutor-cream p-6 shadow-sm shadow-tutor-sage/15 sm:p-10">
          <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-tutor-green">Why take this scholarship exam?</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Fuel Your Ambition Without Financial Barriers</h2><p className="mt-3 text-sm leading-6 text-slate-600">Turn your preparation into opportunity with support that helps you study, compete, and move forward.</p></div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[['shield', 'Make quality education accessible', 'Reduce the cost of your preparation with scholarships designed to reward potential and hard work.'], ['target', 'Measure your true potential', 'Test your preparation in a competitive environment and understand where you stand among top aspirants.'], ['briefcase', 'Get more than a tuition waiver', 'Successful students can unlock offline coaching, library access, and a focused environment for growth.']].map(([icon, title, text]) => <article key={title} className="rounded-2xl border border-[#dfe5dc] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-tutor-sage hover:shadow-md"><span className="grid h-11 w-11 place-items-center rounded-xl bg-tutor-green text-tutor-gold"><Icon name={icon} size={21} /></span><h3 className="mt-5 font-semibold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></article>)}
          </div>
        </div>
        </div>
      </section>

      <section id="about-us" className="scroll-mt-28 border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="rounded-3xl border border-[#dfe5dc] bg-white p-6 shadow-sm shadow-tutor-sage/15 sm:p-10">
            <div className="text-center"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-tutor-green">How it works</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Your Path to Success in 3 Easy Steps</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">A simple journey from registration to your scholarship opportunity.</p></div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[['01', 'Register for NSAT 2026', 'Create your learner account and secure your place in the scholarship admission test.'], ['02', 'Take the scholarship test', 'Complete the focused online assessment during the announced exam window.'], ['03', 'Redeem your scholarship', 'Use your result to claim your eligible tuition waiver and offline study benefits at The Tutor.']].map(([number, title, text]) => <article key={number} className="rounded-2xl border border-[#dfe5dc] bg-tutor-cream p-6 shadow-sm"><p className="grid h-11 w-11 place-items-center rounded-xl bg-tutor-gold text-sm font-bold text-white">{number}</p><h3 className="mt-5 font-semibold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></article>)}
            </div>
          </div>
        </div>
      </section>

      <section id="collaborations" className="scroll-mt-28 w-full bg-tutor-cream px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-[#dfe5dc] bg-tutor-cream p-6 shadow-sm shadow-tutor-sage/15 sm:p-10">
          <div className="text-center"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-tutor-green">Exam structure &amp; guidelines</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Exam Blueprint &amp; Syllabus</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">Know what to expect before you begin and give your best performance.</p></div>
          <div className="mt-8 overflow-hidden rounded-2xl border border-[#dfe5dc] bg-white shadow-sm"><div className="grid gap-0 sm:grid-cols-4">{[['Format', 'Online assessment'], ['Questions', 'Multiple choice'], ['Duration', 'As announced'], ['Eligibility', 'All aspiring learners']].map(([label, value]) => <div key={label} className="border-b border-[#dfe5dc] p-5 last:border-0 sm:border-b-0 sm:border-r sm:last:border-0"><p className="text-xs font-semibold uppercase tracking-wider text-tutor-green">{label}</p><p className="mt-2 text-sm font-semibold text-slate-800">{value}</p></div>)}</div><div className="border-t border-[#dfe5dc] bg-white p-5 text-sm leading-6 text-slate-500">Prepare from your core syllabus, read each question carefully, and keep your assessment window open until you submit.</div></div>
        </div>
        </div>
      </section>

      <section id="faqs" className="scroll-mt-28 border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20"><div className="rounded-3xl border border-[#dfe5dc] bg-tutor-cream p-8 text-center shadow-sm shadow-tutor-sage/15 sm:p-12"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-tutor-green">Social proof &amp; legacy</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Trusted by Parents, Proven by Results</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">The Tutor is committed to giving ambitious learners the guidance, space, and support they need to turn preparation into progress.</p><div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-[#dfe5dc] bg-white p-8 shadow-sm"><p className="text-lg font-semibold text-tutor-green">“The right opportunity can change a student’s direction.”</p><p className="mt-2 text-sm text-slate-500">NSAT 2026 brings that opportunity closer to every serious aspirant.</p></div></div></div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20"><div className="rounded-3xl border border-[#dfe5dc] bg-tutor-cream p-8 shadow-sm shadow-tutor-sage/15 sm:p-12"><div className="text-center"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-tutor-green">Frequently asked questions</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Questions, answered.</h2></div><div className="mx-auto mt-8 max-w-5xl divide-y divide-[#dfe5dc] overflow-hidden rounded-2xl border border-[#dfe5dc] bg-white px-5">{[['Is there any registration fee for the scholarship test?', 'No. Register for NSAT 2026 through this page and follow the instructions provided for your assessment.'], ['Can I take the exam on my mobile phone?', 'Yes. You can take the online assessment on a compatible mobile phone, tablet, or computer with a stable internet connection.'], ['How can I redeem my scholarship offline?', 'Eligible students can contact The Tutor after results are announced. The team will guide you through verification and offline admission.'], ['What if I miss the exam window?', 'The assessment is available only during the announced window. Contact the admissions team as soon as possible if an unexpected issue prevents you from participating.']].map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-semibold text-slate-900">{question}<Icon name="chevron" size={18} className="text-tutor-green transition group-open:rotate-180" /></summary><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{answer}</p></details>)}</div></div></div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8"><div className="rounded-2xl bg-tutor-green px-6 py-12 text-center text-white shadow-lg shadow-tutor-sage/25 sm:px-12"><h2 className="text-3xl font-bold tracking-tight">Ready to unlock your scholarship?</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#dce8d9]">Register for NSAT 2026 and take the first step towards affordable, focused preparation.</p><button onClick={onRegister} className="mt-7 rounded-xl bg-tutor-gold px-6 py-3 text-sm font-semibold text-white hover:bg-[#ad852c]">Register</button></div></section>

      <footer className="border-t border-tutor-green/20 bg-tutor-green text-white">
        <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:py-14">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <a href="/" className="inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-tutor-gold/50" aria-label="Go to TutorX home">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-white p-1.5"><img src="/TutorX%20Logo.png" alt="TutorX" className="h-full w-full object-contain" /></span>
                <span className="text-2xl font-bold tracking-tight">TutorX</span>
              </a>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#dce8d9]">Helping ambitious learners prepare for what is next through opportunity, guidance, and focused learning.</p>
              <button onClick={onRegister} className="mt-6 rounded-xl bg-tutor-gold px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#ad852c]">Register for NSAT 2026</button>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-tutor-gold">Explore</p>
              <nav className="mt-4 flex flex-col items-start gap-3 text-sm text-[#dce8d9]" aria-label="Footer navigation">
                <a href="#why-choose-us" className="transition hover:text-white">Why take NSAT?</a>
                <a href="#about-us" className="transition hover:text-white">How it works</a>
                <a href="#collaborations" className="transition hover:text-white">Exam structure</a>
                <a href="#faqs" className="transition hover:text-white">FAQs</a>
              </nav>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-tutor-gold">Your opportunity</p>
              <p className="mt-4 text-sm leading-6 text-[#dce8d9]">Compete with top aspirants and unlock up to 100% scholarship for offline coaching and library access at The Tutor.</p>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-5 text-xs text-[#b8cdb5] sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} TutorX. All rights reserved.</p>
            <p>NSAT 2026 · Learn. Compete. Grow.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

function ErrorState({ message, onRetry }) {
  return <div className="mx-auto max-w-lg px-5 py-16 text-center"><h1 className="text-xl font-bold text-slate-900">Unable to load your test</h1><p className="mt-2 text-sm text-slate-500">{message}</p><button onClick={onRetry} className="mt-6 rounded bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Try again</button></div>
}

function AlreadyCompleted() {
  return <div className="mx-auto max-w-lg px-5 py-20 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-600"><Icon name="check" size={23} /></div><h1 className="mt-5 text-2xl font-bold text-slate-900">Assessment completed</h1><p className="mt-2 text-sm leading-6 text-slate-500">You have already submitted this assessment. Your result will be shared by the assessment administrator.</p></div>
}

function Instructions({ test, onBegin }) {
  return <main className="min-h-[calc(100vh-4rem)] bg-tutor-cream px-5 py-10 sm:px-8 lg:py-16"><div className="mx-auto max-w-5xl"><div className="rounded-3xl border border-[#dfe5dc] bg-white p-6 shadow-xl shadow-tutor-sage/15 sm:p-10"><div className="flex flex-col gap-6 border-b border-[#dfe5dc] pb-8 sm:flex-row sm:items-start sm:justify-between"><div><p className="inline-flex rounded-full bg-tutor-cream px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-tutor-green">NSAT 2026 · Assessment briefing</p><h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{test.title}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{test.description}</p></div><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-tutor-green text-tutor-gold"><Icon name="clipboard" size={27} /></div></div><div className="my-8 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-[#dfe5dc] bg-tutor-cream p-5"><p className="text-xs font-semibold uppercase tracking-wider text-tutor-green">Questions</p><p className="mt-2 text-2xl font-bold text-slate-900">{test.questions.length}</p></div><div className="rounded-2xl border border-[#dfe5dc] bg-tutor-cream p-5"><p className="text-xs font-semibold uppercase tracking-wider text-tutor-green">Time limit</p><p className="mt-2 text-2xl font-bold text-slate-900">{test.duration}</p></div><div className="rounded-2xl border border-[#dfe5dc] bg-tutor-cream p-5"><p className="text-xs font-semibold uppercase tracking-wider text-tutor-green">Format</p><p className="mt-2 text-2xl font-bold text-slate-900">MCQ</p></div></div><div className="rounded-2xl border border-[#dfe5dc] bg-tutor-cream p-6"><h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><Icon name="shield" size={19} className="text-tutor-green" /> Before you begin</h2><ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600 sm:grid-cols-2"><li className="flex gap-2"><Icon name="check" size={18} className="mt-1 shrink-0 text-tutor-green" />This assessment can be submitted only once.</li><li className="flex gap-2"><Icon name="check" size={18} className="mt-1 shrink-0 text-tutor-green" />Keep the assessment window open until you finish.</li><li className="flex gap-2"><Icon name="check" size={18} className="mt-1 shrink-0 text-tutor-green" />Your result will be shared by the administrator.</li><li className="flex gap-2"><Icon name="check" size={18} className="mt-1 shrink-0 text-tutor-green" />Feedback will be collected after submission.</li></ul></div><div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">By starting, you confirm that you are ready to complete the assessment.</p><button onClick={onBegin} className="rounded-xl bg-tutor-green px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-tutor-sage/25 transition hover:bg-[#3f5039]">Start assessment <span aria-hidden="true">→</span></button></div></div></div></main>
}

function Feedback({ test, onSubmit, submitting, error }) {
  const [rating, setRating] = useState('')
  const [comment, setComment] = useState('')
  return <main className="min-h-[calc(100vh-4rem)] bg-tutor-cream px-5 py-12 sm:px-8"><div className="mx-auto max-w-xl rounded-3xl border border-[#dfe5dc] bg-white p-6 text-center shadow-xl shadow-tutor-sage/15 sm:p-10"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-tutor-green text-tutor-gold"><Icon name="check" size={28} /></div><h1 className="mt-6 text-2xl font-bold text-slate-900">Assessment submitted</h1><p className="mt-2 text-sm leading-6 text-slate-500">Thank you. Your submission for {test.title} was received. Your result will be shared by the administrator.</p><div className="mt-8 rounded-2xl border border-[#dfe5dc] bg-tutor-cream p-6 text-left"><label className="text-sm font-bold text-slate-800" htmlFor="rating">How was the assessment?</label><select id="rating" value={rating} onChange={(event) => setRating(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-tutor-green focus:ring-4 focus:ring-tutor-sage/25"><option value="">Select a rating</option><option value="5">Very good</option><option value="4">Good</option><option value="3">Okay</option><option value="2">Difficult</option><option value="1">Very difficult</option></select><label className="mt-5 block text-sm font-bold text-slate-800" htmlFor="comment">Additional feedback <span className="font-normal text-slate-400">(optional)</span></label><textarea id="comment" value={comment} onChange={(event) => setComment(event.target.value)} rows="4" placeholder="Tell us about your experience" className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-tutor-green focus:ring-4 focus:ring-tutor-sage/25" />{error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}<button disabled={!rating || submitting} onClick={() => onSubmit({ rating: Number(rating), comment })} className="mt-5 w-full rounded-xl bg-tutor-green py-3.5 text-sm font-bold text-white transition hover:bg-[#3f5039] disabled:cursor-not-allowed disabled:bg-slate-300">{submitting ? 'Saving feedback...' : 'Send feedback'}</button></div></div></main>
}

function Runner({ test, token, onSubmitted }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [secondsLeft, setSecondsLeft] = useState(test.durationSeconds)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitPreview, setShowSubmitPreview] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const wasHidden = useRef(false)
  const isSubmittingRef = useRef(false)
  const question = test.questions[current]
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0')
  const seconds = (secondsLeft % 60).toString().padStart(2, '0')
  const answeredCount = Object.keys(answers).length

  const openSubmitPreview = () => {
    setError('')
    setShowSubmitPreview(true)
  }

  const submit = async () => {
    setSubmitting(true)
    isSubmittingRef.current = true
    setError('')
    try {
      const response = await fetch(`/api/attempts/${test.id}`, { method: 'POST', headers: authHeaders(token, true), body: JSON.stringify({ answers }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message || 'The assessment could not be submitted.')
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen()
      }
      onSubmitted()
    } catch (submitError) {
      isSubmittingRef.current = false
      setError(submitError.message)
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (submitting) return undefined
    const timer = setInterval(() => setSecondsLeft((value) => Math.max(value - 1, 0)), 1000)
    return () => clearInterval(timer)
  }, [submitting])

  useEffect(() => {
    const sendEvent = (eventType) => fetch(`/api/attempts/${test.id}/events`, { method: 'POST', headers: authHeaders(token, true), body: JSON.stringify({ eventType }) }).catch(() => {})
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden.current = true
        sendEvent('tab_hidden')
      } else if (wasHidden.current) {
        wasHidden.current = false
        setWarning('You switched away from the assessment. Please stay on this tab until you submit your test.')
      }
    }
    const onBlur = () => sendEvent('window_blur')
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && !isSubmittingRef.current) {
        sendEvent('fullscreen_exit')
        setWarning('Fullscreen mode was exited. Please return to fullscreen to continue your assessment.')
      }
    }
    const onCopy = (event) => { event.preventDefault(); sendEvent('copy_attempt') }
    const onPaste = (event) => { event.preventDefault(); sendEvent('paste_attempt') }
    const onContextMenu = (event) => { event.preventDefault(); sendEvent('context_menu') }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('copy', onCopy)
    document.addEventListener('paste', onPaste)
    document.addEventListener('contextmenu', onContextMenu)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('contextmenu', onContextMenu)
    }
  }, [test.id, token])

  const unansweredCount = test.questions.length - answeredCount

  return <main className="min-h-screen select-none bg-tutor-cream px-4 py-5 sm:px-8 lg:py-8">{warning && <div role="alert" className="mx-auto mb-5 flex max-w-7xl items-start justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm"><div><p className="font-bold">Assessment warning</p><p className="mt-1">{warning}</p></div><button onClick={() => setWarning('')} className="font-semibold text-amber-800 hover:text-amber-950" aria-label="Dismiss warning">Dismiss</button></div>}<div className="mx-auto max-w-7xl"><header className="mb-5 flex flex-col gap-4 rounded-2xl bg-tutor-green px-5 py-5 text-white shadow-lg shadow-tutor-sage/20 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-tutor-gold">NSAT 2026 · Assessment in progress</p><h1 className="mt-1 text-xl font-bold">{test.title}</h1></div><div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${secondsLeft < 60 ? 'bg-red-500 text-white' : 'bg-white/10 text-white'}`}><Icon name="target" size={18} />Time left {minutes}:{seconds}</div></header><div className="mb-5 rounded-2xl border border-[#dfe5dc] bg-white p-4 shadow-sm"><div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500"><span>Question {current + 1} of {test.questions.length}</span><span>{answeredCount} answered</span></div><div className="h-2 overflow-hidden rounded-full bg-tutor-cream"><div className="h-full rounded-full bg-tutor-gold transition-all" style={{ width: `${((current + 1) / test.questions.length) * 100}%` }} /></div></div><div className="grid gap-5 lg:grid-cols-[1fr_250px]"><section className="rounded-3xl border border-[#dfe5dc] bg-white p-6 shadow-sm sm:p-9">  <p className="text-xs font-bold uppercase tracking-[0.16em] text-tutor-green">Question {current + 1}</p>{question.section && <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{question.section}</p>}<h2 className="mt-4 text-xl font-bold leading-8 text-slate-900 sm:text-2xl">{question.question}</h2><div className="mt-8 space-y-3">{question.options.map((option, index) => <button key={option} onClick={() => setAnswers((value) => ({ ...value, [current]: option }))} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left text-sm transition ${answers[current] === option ? 'border-tutor-green bg-tutor-cream text-tutor-green shadow-sm' : 'border-slate-200 text-slate-600 hover:border-tutor-sage hover:bg-tutor-cream/50'}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold ${answers[current] === option ? 'bg-tutor-green text-white' : 'bg-slate-100 text-slate-500'}`}>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}<div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between"><button disabled={current === 0} onClick={() => setCurrent((value) => value - 1)} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-tutor-green hover:text-tutor-green disabled:cursor-not-allowed disabled:opacity-40">← Previous</button><div className="flex flex-col gap-3 sm:flex-row">{current < test.questions.length - 1 && <button onClick={() => setCurrent((value) => value + 1)} className="rounded-xl border border-tutor-green px-6 py-3 text-sm font-bold text-tutor-green transition hover:bg-tutor-cream">Skip question</button>}{current === test.questions.length - 1 ? <button disabled={submitting} onClick={openSubmitPreview} className="rounded-xl bg-tutor-green px-6 py-3 text-sm font-bold text-white transition hover:bg-[#3f5039] disabled:bg-slate-300">{submitting ? 'Submitting...' : 'Submit assessment'}</button> : <button onClick={() => setCurrent((value) => value + 1)} className="rounded-xl bg-tutor-green px-6 py-3 text-sm font-bold text-white transition hover:bg-[#3f5039]">Next question →</button>}</div></div></section><aside className="h-fit rounded-3xl border border-[#dfe5dc] bg-white p-5 shadow-sm lg:sticky lg:top-5"><div className="flex items-center justify-between"><p className="font-bold text-slate-900">Questions</p><Icon name="clipboard" size={18} className="text-tutor-green" /></div><p className="mt-1 text-xs text-slate-500">Jump to any question</p><div className="mt-5 grid grid-cols-5 gap-2">{test.questions.map((item, index) => <button key={item.question} onClick={() => setCurrent(index)} aria-label={`Go to question ${index + 1}`} className={`grid h-10 w-10 place-items-center rounded-xl text-xs font-bold transition ${index === current ? 'bg-tutor-green text-white shadow-sm' : answers[index] ? 'bg-tutor-gold/20 text-tutor-green' : 'bg-tutor-cream text-slate-500 hover:bg-[#e9f0e5]'}`}>{index + 1}</button>)}</div><div className="mt-6 border-t border-slate-100 pt-5 text-xs text-slate-500"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-tutor-green" />Current</div><div className="mt-2 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-tutor-gold" />Answered</div><div className="mt-2 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-tutor-cream" />Not answered</div></div></aside></div></div>{showSubmitPreview && <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="submit-preview-title"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-tutor-green">Submission review</p><h2 id="submit-preview-title" className="mt-2 text-2xl font-bold text-slate-900">Review your answers</h2><p className="mt-2 text-sm text-slate-500">Please confirm your submission. You will not be able to change your answers after submitting.</p></div><button onClick={() => setShowSubmitPreview(false)} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close submission review">×</button></div>  <div className="mt-6 rounded-2xl border border-[#dfe5dc] bg-tutor-cream p-5"><div className="flex flex-wrap gap-3 text-sm font-bold"><span className="rounded-xl bg-tutor-gold/20 px-3 py-2 text-tutor-green">Answered: {answeredCount}</span><span className="rounded-xl bg-white px-3 py-2 text-slate-600">Not answered: {unansweredCount}</span></div><div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">{test.questions.map((item, index) => <div key={item.question} aria-label={`Question ${index + 1} ${answers[index] ? 'answered' : 'not answered'}`} className={`grid h-10 w-10 place-items-center rounded-xl text-xs font-bold ${answers[index] ? 'bg-tutor-gold/20 text-tutor-green' : 'bg-white text-slate-500'}`}>{index + 1}</div>)}</div><div className="mt-5 flex flex-wrap gap-4 border-t border-slate-200 pt-4 text-xs text-slate-500"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-tutor-gold" />Answered</div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-white" />Not answered</div></div></div>{error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}<div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button onClick={() => setShowSubmitPreview(false)} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 hover:border-tutor-green hover:text-tutor-green">Go back</button><button disabled={submitting} onClick={() => { setShowSubmitPreview(false); submit() }} className="rounded-xl bg-tutor-green px-6 py-3 text-sm font-bold text-white transition hover:bg-[#3f5039] disabled:bg-slate-300">{submitting ? 'Submitting...' : 'Confirm and submit'}</button></div></div></div>}</main>
}

export function LearnerTestsPage() {
  const savedToken = localStorage.getItem('quizly_token')
  const savedUser = JSON.parse(localStorage.getItem('quizly_user') || 'null')
  const [test, setTest] = useState(null)
  const [token, setToken] = useState(savedToken)
  const [user, setUser] = useState(savedUser)
  const [phase, setPhase] = useState(savedToken ? 'loading' : 'landing')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [error, setError] = useState('')

  const persistUser = (payload) => {
    localStorage.setItem('quizly_token', payload.token)
    localStorage.setItem('quizly_user', JSON.stringify(payload.user))
    setToken(payload.token)
    setUser(payload.user)
  }

  const loadTest = useCallback(async () => {
    setPhase('loading')
    try {
      const response = await fetch('/api/learner/active-test', { headers: authHeaders(token) })
      const payload = await response.json()
      if (response.status === 409) { setPhase('completed'); return }
      if (response.status === 404) { setPhase('landing'); return }
      if (!response.ok) throw new Error(payload.message || 'Could not load assessment.')
      setTest(payload.test)
      setUser(payload.user)
      setPhase('instructions')
    } catch (loadError) {
      setError(loadError.message)
      setPhase('error')
    }
  }, [token])

  useEffect(() => {
    if (!token) return undefined
    const request = setTimeout(loadTest, 0)
    return () => clearTimeout(request)
  }, [loadTest, token])

  const submitFeedback = async ({ rating, comment }) => {
    setFeedbackSubmitting(true)
    try {
      const response = await fetch('/api/feedback', { method: 'POST', headers: authHeaders(token, true), body: JSON.stringify({ testId: test.id, rating, comment }) })
      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.message || 'Feedback could not be saved.')
      }
      setPhase('feedback-sent')
    } catch (feedbackError) {
      setError(feedbackError.message)
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('quizly_token')
    localStorage.removeItem('quizly_user')
    setToken(null)
    setUser(null)
    setTest(null)
    setError('')
    setPhase('landing')
  }

  let content =
    phase === 'landing' ? <StudentLanding onRegister={() => setPhase('register')} /> :
    phase === 'register' ? <Register onRegister={(payload) => { persistUser(payload); setPhase('loading') }} /> :
    <LoadingState />

  if (phase === 'error') content = <ErrorState message={error} onRetry={loadTest} />
  if (phase === 'completed') content = <AlreadyCompleted />
  if (phase === 'instructions') content = <Instructions test={test} onBegin={() => { document.documentElement.requestFullscreen?.().catch(() => {}); setPhase('running') }} />
  if (phase === 'running') content = <Runner test={test} token={token} onSubmitted={() => setPhase('feedback')} />
  if (phase === 'feedback') content = <Feedback test={test} onSubmit={submitFeedback} submitting={feedbackSubmitting} error={error} />
  if (phase === 'feedback-sent') content = <div className="mx-auto max-w-lg px-5 py-20 text-center"><h1 className="text-2xl font-bold text-slate-900">Thank you for your feedback</h1><p className="mt-2 text-sm text-slate-500">You can close this window now.</p></div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user || { name: 'Learner' }} isLoggedIn={Boolean(token && user)} onRegister={() => setPhase('register')} onLogout={handleLogout} />
      {content}
    </div>
  )
}
