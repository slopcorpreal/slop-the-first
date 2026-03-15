import { useState, useCallback } from 'react'
import { Braces, Copy, Check, AlertCircle, Minimize2, Maximize2, Download } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

const SAMPLES = {
  simple: '{"name":"John","age":30,"city":"New York","hobbies":["reading","coding"],"address":{"street":"123 Main St","zip":"10001"}}',
  api: '{"status":"success","data":{"users":[{"id":1,"name":"Alice","email":"alice@example.com","role":"admin"},{"id":2,"name":"Bob","email":"bob@example.com","role":"user"}],"total":2,"page":1}}',
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unknown error'
}

function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      match => {
        let cls = 'text-blue-400'
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'text-red-400' : 'text-green-400'
        } else if (/true|false/.test(match)) {
          cls = 'text-yellow-400'
        } else if (/null/.test(match)) {
          cls = 'text-slate-400'
        }
        return `<span class="${cls}">${match}</span>`
      }
    )
}

export default function JSONFormatter() {
  const [input, setInput] = useState(SAMPLES.simple)
  const [indent, setIndent] = useState(2)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [sortKeys, setSortKeys] = useState(false)

  const parse = useCallback(() => {
    try {
      return JSON.parse(input)
    } catch {
      return null
    }
  }, [input])

  const validate = useCallback(() => {
    try {
      JSON.parse(input)
      setError('')
      return true
    } catch (error: unknown) {
      setError(getErrorMessage(error))
      return false
    }
  }, [input])

  const format = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      let stringified: string
      if (sortKeys) {
        const sortReplacer = (_: string, v: unknown) => {
          if (v && typeof v === 'object' && !Array.isArray(v)) {
            return Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
          }
          return v
        }
        stringified = JSON.stringify(parsed, sortReplacer, indent)
      } else {
        stringified = JSON.stringify(parsed, undefined, indent)
      }
      setInput(stringified)
      setError('')
    } catch (error: unknown) {
      setError(getErrorMessage(error))
    }
  }, [input, indent, sortKeys])

  const minify = useCallback(() => {
    try {
      setInput(JSON.stringify(JSON.parse(input)))
      setError('')
    } catch (error: unknown) {
      setError(getErrorMessage(error))
    }
  }, [input])

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(input)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [input])

  const download = () => {
    const blob = new Blob([input], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'formatted.json'
    a.click()
  }

  const formatted = (() => {
    try {
      const parsed = JSON.parse(input)
      return JSON.stringify(parsed, null, indent)
    } catch {
      return null
    }
  })()

  const isValid = (() => { try { JSON.parse(input); return true } catch { return false } })()

  const stats = (() => {
    const obj = parse()
    if (!obj) return null
    const str = JSON.stringify(obj)
    const size = new Blob([str]).size
    return { size, keys: str.match(/"[^"]+"\s*:/g)?.length || 0 }
  })()

  return (
    <ToolLayout
      title="JSON Formatter"
      description="Format, validate, minify, and explore JSON with syntax highlighting."
      icon={Braces}
      iconColor="from-yellow-500 to-amber-500"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <button className="btn-primary" onClick={format}><Maximize2 size={14} /> Format</button>
        <button className="btn-secondary" onClick={minify}><Minimize2 size={14} /> Minify</button>
        <button className="btn-secondary" onClick={validate}>Validate</button>
        <div className="flex items-center gap-2 ml-2">
          <label className="label mb-0 text-xs">Indent:</label>
          <select className="input w-20 py-1.5" value={indent} onChange={e => setIndent(+e.target.value)}>
            <option value={2}>2</option>
            <option value={4}>4</option>
            <option value={8}>8</option>
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" checked={sortKeys} onChange={e => setSortKeys(e.target.checked)} className="accent-brand-600" />
          Sort keys
        </label>
        <div className="flex gap-1 ml-auto">
          <select className="input w-32 py-1.5 text-xs" onChange={e => setInput(SAMPLES[e.target.value as keyof typeof SAMPLES])}>
            <option value="">Load sample…</option>
            <option value="simple">Simple object</option>
            <option value="api">API response</option>
          </select>
          <button className="btn-secondary" onClick={copy}>
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
          <button className="btn-secondary" onClick={download}><Download size={14} /></button>
        </div>
      </div>

      {/* Status */}
      {error ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={16} /> {error}
        </div>
      ) : input && isValid ? (
        <div className="flex items-center gap-4 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400">
          ✓ Valid JSON
          {stats && <span className="text-green-500/70 text-xs">{stats.keys} keys · {stats.size} bytes</span>}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div>
          <label className="label">Input JSON</label>
          <textarea
            className="textarea min-h-[500px] font-mono text-xs"
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder='{"key": "value"}'
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div>
          <label className="label">Formatted Output</label>
          <div className="code-block min-h-[500px] text-xs overflow-auto leading-relaxed">
            {formatted ? (
              <div
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(formatted) }}
                className="whitespace-pre"
              />
            ) : (
              <span className="text-slate-500">Enter valid JSON to see formatted output</span>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
