import { useState, useMemo } from 'react'
import { Link2, Copy, Check, Plus, Trash2, ArrowLeftRight } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

interface Param { key: string; value: string }

export default function URLEncoder() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [input, setInput] = useState('Hello World! This is a test: 100% ready & working @ example.com/path?name=John Doe')
  const [copied, setCopied] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.example.com/v1/search')
  const [params, setParams] = useState<Param[]>([
    { key: 'q', value: 'hello world' },
    { key: 'page', value: '1' },
    { key: 'limit', value: '20' },
  ])

  const output = useMemo(() => {
    if (mode === 'encode') return encodeURIComponent(input)
    try { return decodeURIComponent(input) } catch { return 'Invalid encoded string' }
  }, [mode, input])

  const builtUrl = useMemo(() => {
    if (!params.length) return baseUrl
    const qs = params.filter(p => p.key).map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
    return `${baseUrl}${qs ? '?' + qs : ''}`
  }, [baseUrl, params])

  const parseUrl = () => {
    try {
      const url = new URL(input.includes('://') ? input : `https://example.com${input.startsWith('/') ? '' : '/'}${input}`)
      setBaseUrl(`${url.protocol}//${url.host}${url.pathname}`)
      const ps: Param[] = []
      url.searchParams.forEach((v, k) => ps.push({ key: k, value: v }))
      setParams(ps.length ? ps : [{ key: '', value: '' }])
    } catch { alert('Invalid URL') }
  }

  const copy = async (val: string, key: string) => {
    await navigator.clipboard.writeText(val)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <ToolLayout
      title="URL Encoder / Decoder"
      description="Encode/decode URLs, parse query strings, and build URLs with a visual parameter editor."
      icon={Link2}
      iconColor="from-cyan-500 to-blue-500"
    >
      <div className="space-y-6">
        {/* Encode/Decode */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold flex-1">URL Encode / Decode</h2>
            <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
              {(['encode', 'decode'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 text-sm capitalize transition-colors ${mode === m ? 'bg-brand-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{m}</button>
              ))}
            </div>
            <button onClick={() => { setMode(m => m === 'encode' ? 'decode' : 'encode'); setInput(output) }} className="btn-secondary py-1.5 text-sm">
              <ArrowLeftRight size={14} /> Swap
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="label">{mode === 'encode' ? 'Decoded Input' : 'Encoded Input'}</label>
              <textarea className="textarea min-h-[120px] text-sm" value={input} onChange={e => setInput(e.target.value)} spellCheck={false} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">{mode === 'encode' ? 'Encoded Output' : 'Decoded Output'}</label>
                <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded" onClick={() => copy(output, 'main')}>
                  {copied === 'main' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
              <textarea className="textarea min-h-[120px] text-sm bg-slate-50 dark:bg-slate-950" value={output} readOnly spellCheck={false} />
            </div>
          </div>
        </div>

        {/* URL Builder */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold">URL Builder / Parser</h2>
          <div className="flex gap-2">
            <input type="text" className="input flex-1 font-mono text-sm" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://api.example.com/endpoint" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Query Parameters</label>
              <button className="btn-secondary py-1 px-2 text-xs" onClick={() => setParams([...params, { key: '', value: '' }])}>
                <Plus size={12} /> Add
              </button>
            </div>
            {params.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1 font-mono text-sm"
                  placeholder="key"
                  value={p.key}
                  onChange={e => setParams(ps => ps.map((pp, ii) => ii === i ? { ...pp, key: e.target.value } : pp))}
                />
                <input
                  type="text"
                  className="input flex-1 font-mono text-sm"
                  placeholder="value"
                  value={p.value}
                  onChange={e => setParams(ps => ps.map((pp, ii) => ii === i ? { ...pp, value: e.target.value } : pp))}
                />
                <button className="btn-danger p-2" onClick={() => setParams(ps => ps.filter((_, ii) => ii !== i))}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 font-mono text-sm break-all border border-slate-200 dark:border-slate-700">
            {builtUrl}
          </div>

          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => copy(builtUrl, 'built')}>
              {copied === 'built' ? <Check size={14} className="text-green-200" /> : <Copy size={14} />} Copy URL
            </button>
            <button className="btn-secondary" onClick={() => { setInput(builtUrl); parseUrl() }}>
              Parse URL
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <label className="label mb-0 text-sm text-slate-500">Parse from URL:</label>
            <input
              type="text"
              className="input flex-1 text-sm font-mono"
              placeholder="https://api.example.com/search?q=hello&page=1"
              onChange={e => setInput(e.target.value)}
            />
            <button className="btn-secondary text-sm py-1.5" onClick={parseUrl}>Parse</button>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
