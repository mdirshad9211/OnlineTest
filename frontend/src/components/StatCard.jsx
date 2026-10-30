export function StatCard({ label, value, detail, icon, tone }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="mt-0.5 text-[11px] text-emerald-600">{detail}</p>
      </div>
    </div>
  )
}
