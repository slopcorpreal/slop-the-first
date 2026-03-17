import { useState, useEffect } from 'react'
import { Clock, RefreshCw, Copy, Check } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

const FORMATS = [
  { label: 'ISO 8601', fn: (d: Date) => d.toISOString() },
  { label: 'RFC 2822', fn: (d: Date) => d.toUTCString() },
  { label: 'Unix (s)', fn: (d: Date) => Math.floor(d.getTime() / 1000).toString() },
  { label: 'Unix (ms)', fn: (d: Date) => d.getTime().toString() },
  { label: 'Local', fn: (d: Date) => d.toLocaleString() },
  { label: 'Date only', fn: (d: Date) => d.toLocaleDateString() },
  { label: 'Time only', fn: (d: Date) => d.toLocaleTimeString() },
  { label: 'UTC', fn: (d: Date) => d.toUTCString() },
  { label: 'Relative', fn: (d: Date) => {
    const diff = Date.now() - d.getTime()
    const abs = Math.abs(diff)
    const future = diff < 0
    const s = Math.floor(abs / 1000)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    const day = Math.floor(h / 24)
    const str = s < 60 ? `${s}s` : m < 60 ? `${m}m` : h < 24 ? `${h}h` : `${day}d`
    return future ? `in ${str}` : `${str} ago`
  }},
]

const ZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
]

export default function TimestampConverter() {
  const [now, setNow] = useState(() => new Date())
  const [input, setInput] = useState(() => Math.floor(new Date().getTime() / 1000).toString())
  const [parsed, setParsed] = useState<Date | null>(() => new Date())
  const [error, setError] = useState('')
  const [running, setRunning] = useState(true)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [running])

  const parseInput = (val: string) => {
    setInput(val)
    setError('')
    const trimmed = val.trim()
    if (!trimmed) { setParsed(null); return }
    // Try Unix timestamp
    const num = Number(trimmed)
    if (!isNaN(num)) {
      const d = new Date(trimmed.length <= 10 ? num * 1000 : num)
      if (!isNaN(d.getTime())) { setParsed(d); return }
    }
    // Try ISO / natural
    const d = new Date(trimmed)
    if (!isNaN(d.getTime())) { setParsed(d); return }
    setError('Cannot parse date. Try Unix timestamp, ISO 8601, or natural date.')
    setParsed(null)
  }

  const copy = async (val: string, key: string) => {
    await navigator.clipboard.writeText(val)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const setToNow = () => {
    const n = new Date()
    setInput(Math.floor(n.getTime() / 1000).toString())
    setParsed(n)
    setError('')
  }

  return (
    <ToolLayout
      title="Timestamp Converter"
      description="Convert between Unix timestamps, ISO dates, and human-readable formats across time zones."
      icon={Clock}
      iconColor="from-blue-600 to-indigo-600"
    >
      {/* Live clock */}
      <div className="card p-4 flex items-center gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Current Time</p>
          <p className="text-2xl font-bold font-mono tabular-nums">{now.toLocaleTimeString()}</p>
          <p className="text-sm text-slate-500">{now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="ml-4">
          <p className="text-xs text-slate-500">Unix</p>
          <p className="font-mono text-lg tabular-nums">{Math.floor(now.getTime() / 1000)}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="btn-secondary py-1.5" onClick={() => setRunning(!running)}>
            <RefreshCw size={14} className={running ? 'animate-spin' : ''} />
            {running ? 'Pause' : 'Resume'}
          </button>
          <button className="btn-secondary py-1.5" onClick={setToNow}>Use Now</button>
        </div>
      </div>

      {/* Input */}
      <div className="card p-4 space-y-3">
        <label className="label">Convert any timestamp or date</label>
        <input
          type="text"
          className="input font-mono text-lg"
          value={input}
          onChange={e => parseInput(e.target.value)}
          placeholder="1700000000 or 2024-01-15T10:30:00Z or Jan 15 2024…"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {parsed && <p className="text-sm text-green-600 dark:text-green-400">✓ {parsed.toISOString()}</p>}
      </div>

      {/* Conversions */}
      {parsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
          {FORMATS.map(f => {
            const val = f.fn(parsed)
            return (
              <div key={f.label} className="card p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{f.label}</p>
                  <p className="font-mono text-sm truncate">{val}</p>
                </div>
                <button className="flex-shrink-0 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors" onClick={() => copy(val, f.label)}>
                  {copied === f.label ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Timezone table */}
      {parsed && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold">World Clocks</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-2 font-medium text-slate-500">Timezone</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-500">Local Time</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-500">Offset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {ZONES.map(tz => {
                  try {
                    const local = parsed.toLocaleString('en-US', { timeZone: tz, dateStyle: 'short', timeStyle: 'medium' })
                    const offset = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' }).format(parsed).split(' ').pop()
                    return (
                      <tr key={tz} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-2 font-medium text-xs">{tz}</td>
                        <td className="px-4 py-2 font-mono text-xs">{local}</td>
                        <td className="px-4 py-2 text-xs text-slate-400">{offset}</td>
                      </tr>
                    )
                  } catch { return null }
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
