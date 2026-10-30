import { useState } from 'react'
import { mockTests, recentActivity, testCategories } from '../data/mockTests'
import { useTestFilters } from '../hooks/useTestFilters'
import { Icon } from '../components/Icon'
import { Sidebar } from '../components/Sidebar'
import { StatCard } from '../components/StatCard'
import { TestCard } from '../components/TestCard'

export function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { category, filteredTests, query, setCategory, setQuery } = useTestFilters()

  return (
    <div className="flex min-h-screen bg-slate-50">
      {sidebarOpen && <button className="fixed inset-0 z-20 bg-slate-900/30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="min-w-0 flex-1">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8 lg:px-10">
          <button className="mr-3 text-slate-600 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><span className="text-2xl">☰</span></button>
          <div className="relative hidden w-full max-w-sm sm:block">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tests..." className="w-full rounded-xl border-0 bg-slate-100 py-2.5 pl-10 pr-4 text-sm outline-none ring-tutor-sage placeholder:text-slate-400 focus:ring-2" />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <button className="relative text-slate-400 hover:text-tutor-green" aria-label="Notifications"><Icon name="bell" size={20} /><span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-tutor-gold ring-2 ring-white" /></button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-tutor-cream text-sm font-bold text-tutor-green">JD</div>
              <div className="hidden text-left sm:block"><p className="text-sm font-semibold text-slate-800">Jordan Davis</p><p className="text-[11px] text-slate-400">Learner</p></div>
              <Icon name="chevron" size={15} className="hidden text-slate-400 sm:block" />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><p className="mb-2 text-sm font-medium text-tutor-green">Tuesday, October 27, 2026</p><h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Good morning, Jordan <span aria-hidden="true">👋</span></h1><p className="mt-2 text-sm text-slate-500">Ready to learn something new today?</p></div>
            <button className="flex w-fit items-center gap-2 rounded-xl bg-tutor-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-tutor-sage transition hover:bg-[#3f5039]"><Icon name="grid" size={17} />Browse all tests</button>
          </section>

          <section className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Tests completed" value="12" detail="+3 this month" tone="bg-tutor-cream text-tutor-green" icon={<Icon name="check" size={21} />} />
            <StatCard label="Average score" value="84%" detail="+6% from last month" tone="bg-emerald-100 text-emerald-600" icon={<Icon name="chart" size={21} />} />
            <StatCard label="Learning streak" value="7 days" detail="Personal best!" tone="bg-tutor-cream text-tutor-gold" icon={<Icon name="target" size={21} />} />
            <StatCard label="Time learning" value="8.5 hrs" detail="+1.2 hrs this month" tone="bg-fuchsia-100 text-fuchsia-600" icon={<Icon name="briefcase" size={21} />} />
          </section>

          <section className="mb-10">
            <div className="mb-5 flex items-end justify-between"><div><h2 className="text-xl font-bold text-slate-900">Recommended for you</h2><p className="mt-1 text-sm text-slate-500">Build your skills with our curated tests.</p></div><button className="hidden text-sm font-semibold text-tutor-green hover:text-[#3f5039] sm:block">View all <span aria-hidden="true">→</span></button></div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {mockTests.slice(0, 3).map((test) => <TestCard key={test.id} test={test} onStart={() => {}} />)}
            </div>
          </section>

          <section className="mb-10">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-bold text-slate-900">Explore all tests</h2><p className="mt-1 text-sm text-slate-500">{filteredTests.length} tests available to help you grow.</p></div><div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">{testCategories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${category === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{item}</button>)}</div></div>
            {filteredTests.length > 0 ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredTests.map((test) => <TestCard key={test.id} test={test} onStart={() => {}} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center"><p className="font-semibold text-slate-800">No tests found</p><p className="mt-1 text-sm text-slate-500">Try another search or category.</p></div>}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">Recent activity</h2><p className="mt-1 text-sm text-slate-500">Your latest test results.</p></div><button className="text-sm font-semibold text-tutor-green">See history</button></div>
            <div className="divide-y divide-slate-100">{recentActivity.map((activity) => <div key={activity.title} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><div className="flex min-w-0 items-center gap-3"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${activity.color}`}><Icon name="check" size={17} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{activity.title}</p><p className="mt-0.5 text-xs text-slate-400">{activity.date}</p></div></div><span className="text-sm font-bold text-emerald-600">{activity.score}</span></div>)}</div>
          </section>
        </div>
      </main>
    </div>
  )
}
