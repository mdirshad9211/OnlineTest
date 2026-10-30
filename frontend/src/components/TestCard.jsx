import { Icon } from './Icon'

export function TestCard({ test, onStart }) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-tutor-sage hover:shadow-lg hover:shadow-tutor-sage/20">
      <div className="mb-5 flex items-start justify-between">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${test.color}`}>
          <Icon name={test.icon} size={21} />
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">{test.difficulty}</span>
      </div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{test.category}</p>
      <h3 className="text-base font-semibold text-slate-900">{test.title}</h3>
      <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{test.description}</p>
      <div className="my-5 flex gap-4 border-y border-slate-100 py-3 text-xs text-slate-500">
        <span>{test.questions} questions</span><span>{test.duration}</span>
      </div>
      <button onClick={onStart} className="flex w-full items-center justify-center gap-2 rounded-xl bg-tutor-green py-2.5 text-sm font-semibold text-white transition hover:bg-[#3f5039]">
        Start test <Icon name="arrow" size={16} />
      </button>
    </article>
  )
}
