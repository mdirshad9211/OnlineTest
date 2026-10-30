import { Icon } from './Icon'

const navigation = [
  { label: 'Dashboard', icon: 'home', active: true },
  { label: 'Explore tests', icon: 'grid' },
  { label: 'My results', icon: 'chart' },
]

export function Sidebar({ isOpen, onClose }) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white px-5 py-7 transition-transform lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="mb-12 flex items-center justify-between px-2">
        <a href="/" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-tutor-sage/30" aria-label="Go to TutorX home">
          <img src="/TutorX%20Logo.png" alt="TutorX" className="h-9 w-auto object-contain" />
          <span className="text-xl font-bold tracking-tight text-slate-900">TutorX</span>
        </a>
        <button className="text-slate-400 lg:hidden" onClick={onClose} aria-label="Close menu">×</button>
      </div>

      <nav className="space-y-1">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Menu</p>
        {navigation.map((item) => (
          <button key={item.label} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${item.active ? 'bg-tutor-cream text-tutor-green' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <Icon name={item.icon} size={19} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="mt-8 space-y-1">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Account</p>
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"><Icon name="settings" size={19} />Settings</button>
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"><Icon name="help" size={19} />Help center</button>
      </div>
      <div className="mt-auto rounded-2xl bg-tutor-green p-4 text-white">
        <div className="mb-3 grid h-8 w-8 place-items-center rounded-lg bg-white/15"><Icon name="target" size={17} /></div>
        <p className="text-sm font-semibold">Keep learning</p>
        <p className="mt-1 text-xs leading-5 text-[#dce8d9]">Complete one more test to reach your weekly goal.</p>
        <div className="mt-4 h-1.5 rounded-full bg-tutor-sage"><div className="h-full w-3/4 rounded-full bg-white" /></div>
        <p className="mt-2 text-[11px] text-[#dce8d9]">3 of 4 tests completed</p>
      </div>
    </aside>
  )
}
