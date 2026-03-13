import { useState, useMemo } from 'react'
import { Hash as HashIcon, Copy, Check, ArrowLeftRight } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

type Base = 2 | 8 | 10 | 16

function toBase(n: bigint, base: Base): string {
  if (n < 0n) return '-' + (-n).toString(base as number)
  return n.toString(base as number).toUpperCase()
}

function fromBase(s: string, base: Base): bigint | null {
  if (!s.trim()) return null
  try {
    const neg = s.trim().startsWith('-')
    const clean = s.trim().replace(/^-/, '').replace(/\s/g, '').replace(/_/g, '')
    if (clean === '') return null
    const n = BigInt(base === 10 ? clean : `0${base === 2 ? 'b' : base === 8 ? 'o' : 'x'}${clean}`)
    return neg ? -n : n
  } catch {
    return null
  }
}

function formatWithGroups(s: string, groupSize: number, sep = ' '): string {
  if (groupSize <= 0) return s
  const neg = s.startsWith('-')
  const str = neg ? s.slice(1) : s
  const padded = str.padStart(Math.ceil(str.length / groupSize) * groupSize, '0')
  const grouped = padded.match(new RegExp(`.{1,${groupSize}}`, 'g'))!.join(sep)
  return neg ? '-' + grouped : grouped
}

const BASE_INFO: Record<Base, { label: string; prefix: string; chars: string; groupSize: number }> = {
  2:  { label: 'Binary',      prefix: '0b', chars: '01',             groupSize: 4 },
  8:  { label: 'Octal',       prefix: '0o', chars: '0-7',            groupSize: 3 },
  10: { label: 'Decimal',     prefix: '',   chars: '0-9',            groupSize: 3 },
  16: { label: 'Hexadecimal', prefix: '0x', chars: '0-9, A-F',       groupSize: 4 },
}

const BITWISE_OPS = [
  { op: 'AND', sym: '&',  fn: (a: bigint, b: bigint) => a & b },
  { op: 'OR',  sym: '|',  fn: (a: bigint, b: bigint) => a | b },
  { op: 'XOR', sym: '^',  fn: (a: bigint, b: bigint) => a ^ b },
  { op: 'NOT', sym: '~',  fn: (a: bigint, _: bigint) => ~a },
  { op: 'SHL', sym: '<<', fn: (a: bigint, b: bigint) => a << b },
  { op: 'SHR', sym: '>>', fn: (a: bigint, b: bigint) => a >> b },
]

export default function NumberBase() {
  const [inputs, setInputs] = useState<Record<Base, string>>({ 2: '', 8: '', 10: '255', 16: '' })
  const [bwA, setBwA] = useState('255')
  const [bwB, setBwB] = useState('170')
  const [copied, setCopied] = useState<string | null>(null)

  const value = useMemo((): bigint | null => {
    // find first non-empty input and parse it with its base
    for (const b of [10, 16, 2, 8] as Base[]) {
      if (inputs[b]) return fromBase(inputs[b], b)
    }
    return null
  }, [inputs])

  const converted = useMemo(() => {
    if (value === null) return null
    return {
      2:  toBase(value, 2),
      8:  toBase(value, 8),
      10: toBase(value, 10),
      16: toBase(value, 16),
    }
  }, [value])

  const handleChange = (base: Base, raw: string) => {
    setInputs(prev => {
      const next = { ...prev }
      // clear others
      for (const b of [2, 8, 10, 16] as Base[]) next[b] = ''
      next[base] = raw
      return next
    })
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  // Bitwise
  const bwAVal = useMemo(() => fromBase(bwA, 10), [bwA])
  const bwBVal = useMemo(() => fromBase(bwB, 10), [bwB])

  const bwResults = useMemo(() => {
    if (bwAVal === null) return null
    return BITWISE_OPS.map(op => {
      try {
        const result = op.fn(bwAVal, bwBVal ?? 0n)
        return {
          ...op,
          result,
          bin: formatWithGroups(toBase(result < 0n ? result : result, 2), 4),
          hex: toBase(result < 0n ? result : result, 16),
          dec: toBase(result, 10),
        }
      } catch {
        return { ...op, result: null, bin: 'overflow', hex: '', dec: '' }
      }
    })
  }, [bwAVal, bwBVal])

  const bases: Base[] = [10, 2, 16, 8]

  return (
    <ToolLayout
      title="Number Base Converter"
      description="Convert numbers between binary, octal, decimal, and hexadecimal. Plus bitwise operations."
      icon={HashIcon}
      iconColor="from-sky-500 to-blue-600"
    >
      <div className="space-y-6">
        {/* Converter */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <ArrowLeftRight size={16} className="text-brand-500" /> Base Converter
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bases.map(base => {
              const info = BASE_INFO[base]
              const displayVal = converted ? converted[base] : inputs[base]
              const grouped = displayVal && base !== 10
                ? formatWithGroups(displayVal, info.groupSize)
                : ''
              return (
                <div key={base}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label mb-0">
                      <span className="font-bold">{info.label}</span>
                      <span className="text-slate-400 ml-1 font-normal text-xs">(base {base}) — {info.chars}</span>
                    </label>
                    {displayVal && (
                      <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => copy(displayVal, `base-${base}`)}>
                        {copied === `base-${base}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-slate-400" />}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-sm shrink-0">{info.prefix}</span>
                    <input
                      type="text"
                      className="input font-mono"
                      value={displayVal || ''}
                      onChange={e => handleChange(base, e.target.value.replace(/\s/g, ''))}
                      placeholder={`Enter ${info.label.toLowerCase()}…`}
                      spellCheck={false}
                    />
                  </div>
                  {grouped && (
                    <p className="text-xs text-slate-400 font-mono mt-1">{info.prefix}{grouped}</p>
                  )}
                </div>
              )
            })}
          </div>
          {value !== null && (
            <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700">
              <span>Bits needed: <strong className="text-slate-700 dark:text-slate-300">{value === 0n ? 1 : value < 0n ? (-value).toString(2).length + 1 : value.toString(2).length}</strong></span>
              <span>Fits in: <strong className="text-slate-700 dark:text-slate-300">{value >= 0n && value <= 0xffn ? '8-bit' : value >= 0n && value <= 0xffffn ? '16-bit' : value >= 0n && value <= 0xffffffffn ? '32-bit' : '64-bit+'}</strong></span>
              {value >= 32n && value <= 126n && <span>ASCII: <strong className="text-slate-700 dark:text-slate-300">{String.fromCharCode(Number(value))}</strong></span>}
            </div>
          )}
        </div>

        {/* Bitwise Operations */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-sm">Bitwise Operations</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">A (decimal)</label>
              <input type="text" className="input font-mono" value={bwA} onChange={e => setBwA(e.target.value)} placeholder="255" />
            </div>
            <div>
              <label className="label">B (decimal)</label>
              <input type="text" className="input font-mono" value={bwB} onChange={e => setBwB(e.target.value)} placeholder="170" />
            </div>
            <div className="sm:col-span-2 self-end">
              {bwAVal !== null && bwBVal !== null && (
                <div className="text-xs text-slate-400 font-mono space-y-0.5">
                  <div>A = {formatWithGroups(toBase(bwAVal < 0n ? bwAVal : bwAVal, 2), 4)} (bin)</div>
                  <div>B = {formatWithGroups(toBase(bwBVal < 0n ? bwBVal : bwBVal, 2), 4)} (bin)</div>
                </div>
              )}
            </div>
          </div>

          {bwResults && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase">
                    <th className="text-left py-2 pr-4">Operation</th>
                    <th className="text-left py-2 pr-4">Decimal</th>
                    <th className="text-left py-2 pr-4">Hex</th>
                    <th className="text-left py-2">Binary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {bwResults.map(r => (
                    <tr key={r.op}>
                      <td className="py-2 pr-4">
                        <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{r.sym}</span>
                        <span className="text-slate-400 ml-2 text-xs">{r.op}</span>
                      </td>
                      <td className="py-2 pr-4 font-mono text-slate-800 dark:text-slate-200">{r.dec}</td>
                      <td className="py-2 pr-4 font-mono text-purple-600 dark:text-purple-400">0x{r.hex}</td>
                      <td className="py-2 font-mono text-xs text-slate-500">{r.bin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
