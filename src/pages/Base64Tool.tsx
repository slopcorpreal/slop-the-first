import { useState, useRef } from 'react'
import { Binary, Copy, Check, Upload, Download, ArrowLeftRight } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

function toBase64(str: string, url = false) {
  try {
    const b64 = btoa(unescape(encodeURIComponent(str)))
    return url ? b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') : b64
  } catch { return '' }
}

function fromBase64(str: string) {
  try {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    return decodeURIComponent(escape(atob(b64)))
  } catch { return 'Invalid Base64 input' }
}

export default function Base64Tool() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [input, setInput] = useState('')
  const [urlSafe, setUrlSafe] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fileResult, setFileResult] = useState('')
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const output = mode === 'encode' ? toBase64(input, urlSafe) : fromBase64(input)

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFileEncode = (f: File) => {
    setFileName(f.name)
    const reader = new FileReader()
    reader.onload = () => {
      const base = (reader.result as string).split(',')[1]
      setFileResult(base)
    }
    reader.readAsDataURL(f)
  }

  const downloadDecoded = () => {
    try {
      const binary = atob(input.replace(/-/g, '+').replace(/_/g, '/'))
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes])
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'decoded-file'
      a.click()
    } catch { alert('Invalid Base64') }
  }

  return (
    <ToolLayout
      title="Base64 Encoder / Decoder"
      description="Encode and decode Base64, Base64URL. Supports text, files, and binary data."
      icon={Binary}
      iconColor="from-orange-500 to-red-500"
    >
      <div className="space-y-4">
        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
            {(['encode', 'decode'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${mode === m ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setMode(m => m === 'encode' ? 'decode' : 'encode'); setInput(output) }}
            className="btn-secondary"
            title="Swap input/output"
          >
            <ArrowLeftRight size={16} /> Swap
          </button>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="checkbox" checked={urlSafe} onChange={e => setUrlSafe(e.target.checked)} className="accent-brand-600" />
            URL-safe (Base64URL)
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="label">{mode === 'encode' ? 'Plain Text Input' : 'Base64 Input'}</label>
            <textarea
              className="textarea min-h-[300px]"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={mode === 'encode' ? 'Enter text to encode…' : 'Enter Base64 to decode…'}
              spellCheck={false}
            />
            <p className="text-xs text-slate-400 mt-1">{input.length} chars</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">{mode === 'encode' ? 'Base64 Output' : 'Decoded Output'}</label>
              <div className="flex gap-1">
                <button className="btn-secondary py-1 px-2 text-xs" onClick={() => copy(output)}>
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  Copy
                </button>
                {mode === 'decode' && (
                  <button className="btn-secondary py-1 px-2 text-xs" onClick={downloadDecoded}>
                    <Download size={12} /> File
                  </button>
                )}
              </div>
            </div>
            <textarea
              className="textarea min-h-[300px] bg-slate-50 dark:bg-slate-950"
              value={output}
              readOnly
              spellCheck={false}
            />
            <p className="text-xs text-slate-400 mt-1">{output.length} chars</p>
          </div>
        </div>

        {/* File encode section */}
        <div className="card p-4">
          <h3 className="font-medium text-sm mb-3">File → Base64</h3>
          <div className="flex gap-2">
            <input ref={inputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileEncode(f) }} />
            <button className="btn-secondary" onClick={() => inputRef.current?.click()}>
              <Upload size={14} /> Choose File
            </button>
            {fileName && <span className="text-sm text-slate-500 self-center">{fileName}</span>}
          </div>
          {fileResult && (
            <div className="mt-3 space-y-2">
              <textarea className="textarea text-xs min-h-[100px]" value={fileResult} readOnly spellCheck={false} />
              <div className="flex gap-2">
                <button className="btn-secondary text-xs" onClick={() => copy(fileResult)}>
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />} Copy Base64
                </button>
                <button className="btn-secondary text-xs" onClick={() => copy(`data:application/octet-stream;base64,${fileResult}`)}>
                  Copy as Data URL
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
