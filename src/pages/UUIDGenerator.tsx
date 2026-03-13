import { useState, useCallback } from 'react'
import { Fingerprint, Copy, Check, RefreshCw, Trash2 } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

function uuidv4(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const h = Array.from(bytes).map(b => b.toString(16).padStart(2, '0'))
  return `${h.slice(0,4).join('')}-${h.slice(4,6).join('')}-${h.slice(6,8).join('')}-${h.slice(8,10).join('')}-${h.slice(10).join('')}`
}

// Nil UUID
const NIL = '00000000-0000-0000-0000-000000000000'
const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function inspectUUID(uuid: string) {
  if (!UUID_REGEX.test(uuid)) return null
  const clean = uuid.replace(/-/g, '')
  const version = parseInt(clean[12], 16)
  const variant = parseInt(clean[16], 16)
  let variantName = 'Unknown'
  if ((variant & 0b1000) === 0) variantName = 'NCS (v0)'
  else if ((variant & 0b1100) === 0b1000) variantName = 'RFC 4122'
  else if ((variant & 0b1110) === 0b1100) variantName = 'Microsoft (COM/DCOM)'
  else if ((variant & 0b1111) === 0b1110) variantName = 'Reserved'

  const versionNames: Record<number, string> = {
    1: 'v1 (time-based)',
    2: 'v2 (DCE Security)',
    3: 'v3 (MD5 hash)',
    4: 'v4 (random)',
    5: 'v5 (SHA-1 hash)',
    6: 'v6 (reordered time)',
    7: 'v7 (Unix time)',
    8: 'v8 (custom)',
  }

  // For v1: extract timestamp
  let timestamp: string | null = null
  if (version === 1) {
    const timeLow = parseInt(clean.slice(0, 8), 16)
    const timeMid = parseInt(clean.slice(8, 12), 16)
    const timeHigh = parseInt(clean.slice(12, 16), 16) & 0x0fff
    const ticks = BigInt(timeHigh) * BigInt(0x100000000) * BigInt(0x10000)
      + BigInt(timeMid) * BigInt(0x100000000)
      + BigInt(timeLow)
    const EPOCH_DIFF = BigInt('122192928000000000')
    const msec = Number((ticks - EPOCH_DIFF) / BigInt(10000))
    timestamp = new Date(msec).toISOString()
  }

  return { version, versionName: versionNames[version] || `v${version} (unknown)`, variantName, timestamp }
}

function formatUUID(val: string, fmt: string): string {
  const clean = val.replace(/-/g, '')
  if (fmt === 'standard') return val
  if (fmt === 'no-hyphens') return clean
  if (fmt === 'uppercase') return val.toUpperCase()
  if (fmt === 'braces') return `{${val}}`
  if (fmt === 'urn') return `urn:uuid:${val}`
  if (fmt === 'hex-array') return `0x${clean.match(/.{1,2}/g)!.join(', 0x')}`
  return val
}

export default function UUIDGenerator() {
  const [uuids, setUUIDs] = useState<string[]>([uuidv4()])
  const [count, setCount] = useState(10)
  const [format, setFormat] = useState('standard')
  const [copied, setCopied] = useState<string | null>(null)
  const [validateInput, setValidateInput] = useState('')

  const generate = useCallback(() => {
    setUUIDs(Array.from({ length: count }, () => uuidv4()))
  }, [count])

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const copyAll = () => copy(uuids.map(u => formatUUID(u, format)).join('\n'), 'all')

  const inspection = inspectUUID(validateInput.trim())
  const isValidFormat = validateInput.trim() === '' || UUID_REGEX.test(validateInput.trim())

  return (
    <ToolLayout
      title="UUID Generator"
      description="Generate cryptographically random UUIDs (v4), bulk export in multiple formats, and inspect/validate any UUID."
      icon={Fingerprint}
      iconColor="from-violet-500 to-purple-600"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator */}
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            <h3 className="font-semibold text-sm">Generator Settings</h3>
            <div className="flex items-center gap-3">
              <label className="label mb-0 shrink-0">Count</label>
              <input
                type="number" min={1} max={1000}
                value={count}
                onChange={e => setCount(Math.min(1000, Math.max(1, +e.target.value)))}
                className="input w-24 py-1.5"
              />
            </div>
            <div>
              <label className="label">Output Format</label>
              <select className="input" value={format} onChange={e => setFormat(e.target.value)}>
                <option value="standard">Standard (lowercase with hyphens)</option>
                <option value="uppercase">Uppercase</option>
                <option value="no-hyphens">No hyphens</option>
                <option value="braces">With braces {'{uuid}'}</option>
                <option value="urn">URN format</option>
                <option value="hex-array">Hex byte array</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary flex-1 justify-center" onClick={generate}>
                <RefreshCw size={16} /> Generate {count} UUID{count !== 1 ? 's' : ''}
              </button>
              <button className="btn-secondary" onClick={() => setUUIDs([])}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Special UUIDs */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-sm">Special UUIDs</h3>
            {[
              { label: 'Nil UUID (all zeros)', val: NIL },
              { label: 'Max UUID (all ones)', val: MAX },
            ].map(({ label, val }) => (
              <div key={val} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-400">{label}</p>
                  <code className="text-xs font-mono">{val}</code>
                </div>
                <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => copy(val, val)}>
                  {copied === val ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-slate-400" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Output + Validator */}
        <div className="space-y-4">
          {uuids.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="label mb-0">{uuids.length} UUID{uuids.length !== 1 ? 's' : ''}</label>
                <button className="btn-secondary py-1 text-xs" onClick={copyAll}>
                  {copied === 'all' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  Copy All
                </button>
              </div>
              <div className="code-block max-h-64 overflow-auto space-y-0.5">
                {uuids.map((u, i) => (
                  <div key={i} className="flex items-center justify-between group py-0.5">
                    <code className="text-xs font-mono text-green-300 select-all">{formatUUID(u, format)}</code>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 transition-all"
                      onClick={() => copy(formatUUID(u, format), `u-${i}`)}
                    >
                      {copied === `u-${i}` ? <Check size={10} className="text-green-400" /> : <Copy size={10} className="text-slate-400" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validator / Inspector */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-sm">Inspector / Validator</h3>
            <div>
              <label className="label">Paste a UUID to inspect</label>
              <input
                type="text"
                className={`input font-mono text-sm ${!isValidFormat ? 'border-red-400 focus:ring-red-400' : ''}`}
                value={validateInput}
                onChange={e => setValidateInput(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                spellCheck={false}
              />
            </div>
            {validateInput.trim() && (
              !isValidFormat ? (
                <div className="text-sm text-red-500">✗ Not a valid UUID format</div>
              ) : inspection ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">✓ Valid UUID</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="card p-2">
                      <p className="text-slate-400">Version</p>
                      <p className="font-semibold">{inspection.versionName}</p>
                    </div>
                    <div className="card p-2">
                      <p className="text-slate-400">Variant</p>
                      <p className="font-semibold">{inspection.variantName}</p>
                    </div>
                    {inspection.timestamp && (
                      <div className="card p-2 col-span-2">
                        <p className="text-slate-400">Embedded Timestamp (v1)</p>
                        <p className="font-mono font-semibold">{inspection.timestamp}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
