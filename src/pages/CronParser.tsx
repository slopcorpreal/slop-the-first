import { useState, useMemo } from 'react'
import { Calendar, Copy, Check, ChevronRight } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

// Cron field specs
const FIELDS = [
  { name: 'Minute',      min: 0,  max: 59,  pos: 0 },
  { name: 'Hour',        min: 0,  max: 23,  pos: 1 },
  { name: 'Day (month)', min: 1,  max: 31,  pos: 2 },
  { name: 'Month',       min: 1,  max: 12,  pos: 3 },
  { name: 'Day (week)',  min: 0,  max: 6,   pos: 4 },
]

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const PRESETS = [
  { label: 'Every minute',        expr: '* * * * *' },
  { label: 'Every 5 minutes',     expr: '*/5 * * * *' },
  { label: 'Every 15 minutes',    expr: '*/15 * * * *' },
  { label: 'Every 30 minutes',    expr: '*/30 * * * *' },
  { label: 'Every hour',          expr: '0 * * * *' },
  { label: 'Every 6 hours',       expr: '0 */6 * * *' },
  { label: 'Daily at midnight',   expr: '0 0 * * *' },
  { label: 'Daily at noon',       expr: '0 12 * * *' },
  { label: 'Every Monday 9am',    expr: '0 9 * * 1' },
  { label: 'Weekdays 9–5',        expr: '0 9-17 * * 1-5' },
  { label: 'First of month',      expr: '0 0 1 * *' },
  { label: 'Last Sunday 11pm',    expr: '0 23 * * 0' },
  { label: 'Quarterly',           expr: '0 0 1 1,4,7,10 *' },
  { label: 'Yearly (Jan 1)',      expr: '0 0 1 1 *' },
]

// Parse a single cron field into an array of values
function parseField(field: string, min: number, max: number): number[] | null {
  if (field === '*') return null // means "all"
  const values: number[] = []
  for (const part of field.split(',')) {
    if (part.includes('/')) {
      const [range, step] = part.split('/')
      const stepNum = parseInt(step)
      if (isNaN(stepNum) || stepNum <= 0) return null
      const [lo, hi] = range === '*' ? [min, max] : range.split('-').map(Number)
      for (let i = lo; i <= (hi ?? lo); i += stepNum) values.push(i)
    } else if (part.includes('-')) {
      const [lo, hi] = part.split('-').map(Number)
      for (let i = lo; i <= hi; i++) values.push(i)
    } else {
      const n = parseInt(part)
      if (isNaN(n)) return null
      values.push(n)
    }
  }
  // Validate range
  if (values.some(v => v < min || v > max)) return null
  return [...new Set(values)].sort((a, b) => a - b)
}

function parseCron(expr: string): { fields: (number[] | null)[]; error: string | null } {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return { fields: [], error: 'Expected exactly 5 fields (min hour dom month dow)' }
  const fields: (number[] | null)[] = []
  for (let i = 0; i < 5; i++) {
    const f = parseField(parts[i], FIELDS[i].min, FIELDS[i].max)
    if (f === undefined) return { fields: [], error: `Invalid value in ${FIELDS[i].name} field: "${parts[i]}"` }
    fields.push(f)
  }
  return { fields, error: null }
}

function describeField(field: string, pos: number): string {
  if (field === '*') {
    const labels = ['every minute', 'every hour', 'every day', 'every month', 'every day of the week']
    return labels[pos]
  }
  const { min, max } = FIELDS[pos]
  const vals = parseField(field, min, max)
  if (!vals) return field

  const names = pos === 3 ? MONTH_NAMES : pos === 4 ? DAY_NAMES : null

  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2))
    const units = ['minute', 'hour', 'day', 'month', 'weekday']
    return `every ${step} ${units[pos]}${step !== 1 ? 's' : ''}`
  }
  if (field.includes('-') && !field.includes(',')) {
    const [lo, hi] = field.split('-').map(Number)
    if (names) return `from ${names[lo]} to ${names[hi]}`
    return `from ${lo} to ${hi}`
  }

  const mapped = names ? vals.map(v => names[v]) : vals.map(String)
  return mapped.join(', ')
}

function describeSchedule(expr: string): string {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return 'Invalid expression'
  const [min, hour, dom, month, dow] = parts

  const minuteDesc = min === '*' ? 'every minute' : min.startsWith('*/') ? `every ${min.slice(2)} minutes` : `at minute ${describeField(min, 0)}`
  const hourDesc = hour === '*' ? 'every hour' : `at ${describeField(hour, 1)}`
  const domDesc = dom === '*' ? '' : `, on day ${describeField(dom, 2)} of the month`
  const monthDesc = month === '*' ? '' : `, in ${describeField(month, 3)}`
  const dowDesc = dow === '*' ? '' : `, on ${describeField(dow, 4)}`

  return `Runs ${minuteDesc}, ${hourDesc}${domDesc}${monthDesc}${dowDesc}.`
}

// Get next N run times
function getNextRuns(expr: string, count: number): Date[] {
  const { fields, error } = parseCron(expr)
  if (error || !fields.length) return []

  const [minField, hourField, domField, monthField, dowField] = fields
  const results: Date[] = []
  const now = new Date()
  const cur = new Date(now)
  cur.setSeconds(0, 0)
  cur.setMinutes(cur.getMinutes() + 1) // start from next minute

  let safety = 0
  while (results.length < count && safety < 100000) {
    safety++
    // Check month (1-indexed)
    const m = cur.getMonth() + 1
    if (monthField && !monthField.includes(m)) {
      cur.setMonth(cur.getMonth() + 1, 1)
      cur.setHours(0, 0, 0, 0)
      continue
    }
    // Check dom
    if (domField && !domField.includes(cur.getDate())) {
      cur.setDate(cur.getDate() + 1)
      cur.setHours(0, 0, 0, 0)
      continue
    }
    // Check dow
    if (dowField && !dowField.includes(cur.getDay())) {
      cur.setDate(cur.getDate() + 1)
      cur.setHours(0, 0, 0, 0)
      continue
    }
    // Check hour
    if (hourField && !hourField.includes(cur.getHours())) {
      cur.setHours(cur.getHours() + 1, 0, 0, 0)
      continue
    }
    // Check minute
    if (minField && !minField.includes(cur.getMinutes())) {
      cur.setMinutes(cur.getMinutes() + 1, 0, 0)
      continue
    }
    results.push(new Date(cur))
    cur.setMinutes(cur.getMinutes() + 1, 0, 0)
  }
  return results
}

export default function CronParser() {
  const [expr, setExpr] = useState('*/15 9-17 * * 1-5')
  const [copied, setCopied] = useState(false)

  const { error } = useMemo(() => parseCron(expr), [expr])
  const description = useMemo(() => error ? '' : describeSchedule(expr), [expr, error])
  const nextRuns = useMemo(() => error ? [] : getNextRuns(expr, 10), [expr, error])

  const parts = expr.trim().split(/\s+/)

  const copy = async () => {
    await navigator.clipboard.writeText(expr)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ToolLayout
      title="Cron Expression Parser"
      description="Parse and describe cron expressions in plain English. See the next scheduled run times."
      icon={Calendar}
      iconColor="from-rose-500 to-pink-600"
    >
      <div className="space-y-5">
        {/* Input */}
        <div>
          <label className="label">Cron Expression <span className="text-slate-400 font-normal">(5 fields: minute hour day month weekday)</span></label>
          <div className="flex gap-2">
            <input
              type="text"
              className={`input font-mono text-lg tracking-widest flex-1 ${error ? 'border-red-400' : ''}`}
              value={expr}
              onChange={e => setExpr(e.target.value)}
              spellCheck={false}
              placeholder="* * * * *"
            />
            <button className="btn-secondary" onClick={copy}>
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Field breakdown */}
        {parts.length === 5 && (
          <div className="grid grid-cols-5 gap-2">
            {parts.map((p, i) => (
              <div key={i} className={`card p-3 text-center ${error ? 'opacity-50' : ''}`}>
                <p className="text-xs text-slate-400 mb-1">{FIELDS[i].name}</p>
                <p className="font-mono font-bold text-lg text-brand-600 dark:text-brand-400">{p}</p>
                <p className="text-xs text-slate-500 mt-1">{i < 5 ? `${FIELDS[i].min}–${FIELDS[i].max}` : ''}</p>
              </div>
            ))}
          </div>
        )}

        {error ? (
          <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            ✗ {error}
          </div>
        ) : (
          <div className="px-4 py-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
            <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
              <span className="text-brand-400">📅 </span>{description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Next runs */}
          {nextRuns.length > 0 && (
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-sm">Next 10 Scheduled Runs</h3>
              <div className="space-y-1.5">
                {nextRuns.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <span className="text-xs text-slate-400 ml-auto">
                      {DAY_ABBR[d.getDay()]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Presets */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-sm">Common Presets</h3>
            <div className="space-y-1">
              {PRESETS.map(p => (
                <button
                  key={p.expr}
                  onClick={() => setExpr(p.expr)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors group ${expr === p.expr ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  <span>{p.label}</span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs text-slate-400 group-hover:text-brand-500">{p.expr}</code>
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Field reference */}
        <div className="card p-4">
          <h3 className="font-semibold text-sm mb-3">Quick Reference</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { sym: '*',    desc: 'Any value' },
              { sym: ',',    desc: 'List (1,2,3)' },
              { sym: '-',    desc: 'Range (1-5)' },
              { sym: '/',    desc: 'Step (*/5)' },
            ].map(({ sym, desc }) => (
              <div key={sym} className="flex items-center gap-2">
                <code className="font-mono font-bold text-brand-600 dark:text-brand-400 text-base w-6">{sym}</code>
                <span className="text-slate-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
