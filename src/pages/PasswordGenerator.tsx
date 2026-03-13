import { useState, useCallback } from 'react'
import { Lock, Copy, Check, RefreshCw, Shield } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?'
const AMBIGUOUS = /[0Ol1I]/g

function entropy(length: number, charsetSize: number) {
  if (charsetSize === 0 || length === 0) return 0
  return Math.floor(length * Math.log2(charsetSize))
}

function strengthLabel(bits: number): { label: string; color: string; width: string } {
  if (bits < 28) return { label: 'Very Weak', color: 'bg-red-500', width: 'w-1/5' }
  if (bits < 36) return { label: 'Weak', color: 'bg-orange-500', width: 'w-2/5' }
  if (bits < 60) return { label: 'Moderate', color: 'bg-yellow-500', width: 'w-3/5' }
  if (bits < 128) return { label: 'Strong', color: 'bg-green-500', width: 'w-4/5' }
  return { label: 'Very Strong', color: 'bg-emerald-500', width: 'w-full' }
}

function generatePassword(
  length: number,
  lower: boolean,
  upper: boolean,
  digits: boolean,
  symbols: boolean,
  noAmbiguous: boolean
): string {
  let chars = ''
  if (lower) chars += LOWERCASE
  if (upper) chars += UPPERCASE
  if (digits) chars += DIGITS
  if (symbols) chars += SYMBOLS
  if (noAmbiguous) chars = chars.replace(AMBIGUOUS, '')
  if (!chars) return ''

  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(n => chars[n % chars.length]).join('')
}

function charsetSize(lower: boolean, upper: boolean, digits: boolean, symbols: boolean, noAmbiguous: boolean) {
  let s = 0
  if (lower) s += LOWERCASE.length
  if (upper) s += UPPERCASE.length
  if (digits) s += DIGITS.length
  if (symbols) s += SYMBOLS.length
  if (noAmbiguous) {
    const ambig = LOWERCASE.split('').filter(c => AMBIGUOUS.test(c)).length
      + UPPERCASE.split('').filter(c => AMBIGUOUS.test(c)).length
      + DIGITS.split('').filter(c => AMBIGUOUS.test(c)).length
    s -= ambig
    // reset regex lastIndex
    AMBIGUOUS.lastIndex = 0
  }
  AMBIGUOUS.lastIndex = 0
  return Math.max(1, s)
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(20)
  const [lower, setLower] = useState(true)
  const [upper, setUpper] = useState(true)
  const [digits, setDigits] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [noAmbiguous, setNoAmbiguous] = useState(false)
  const [count, setCount] = useState(5)
  const [passwords, setPasswords] = useState<string[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  const generate = useCallback(() => {
    const list: string[] = []
    for (let i = 0; i < count; i++) {
      list.push(generatePassword(length, lower, upper, digits, symbols, noAmbiguous))
    }
    setPasswords(list)
  }, [length, lower, upper, digits, symbols, noAmbiguous, count])

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const copyAll = () => copy(passwords.join('\n'), 'all')

  const cs = charsetSize(lower, upper, digits, symbols, noAmbiguous)
  const bits = entropy(length, cs)
  const str = strengthLabel(bits)

  // Build charset preview
  const charsetPreview = [
    lower ? 'a-z' : '',
    upper ? 'A-Z' : '',
    digits ? '0-9' : '',
    symbols ? '!@#…' : '',
  ].filter(Boolean).join(' ')

  return (
    <ToolLayout
      title="Password Generator"
      description="Generate cryptographically secure passwords with entropy analysis and strength scoring."
      icon={Lock}
      iconColor="from-emerald-500 to-teal-600"
      badge="Web Crypto"
      badgeColor="badge-green"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings */}
        <div className="space-y-5">
          <div className="card p-5 space-y-5">
            {/* Length */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Length</label>
                <input
                  type="number"
                  min={4} max={128}
                  value={length}
                  onChange={e => setLength(Math.min(128, Math.max(4, +e.target.value)))}
                  className="input w-20 text-center py-1"
                />
              </div>
              <input
                type="range" min={4} max={128}
                value={length}
                onChange={e => setLength(+e.target.value)}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>4</span><span>128</span>
              </div>
            </div>

            {/* Character sets */}
            <div className="space-y-2">
              <label className="label mb-1">Character Sets</label>
              {[
                { id: 'lower', label: 'Lowercase (a-z)', val: lower, set: setLower },
                { id: 'upper', label: 'Uppercase (A-Z)', val: upper, set: setUpper },
                { id: 'digits', label: 'Digits (0-9)', val: digits, set: setDigits },
                { id: 'symbols', label: 'Symbols (!@#$…)', val: symbols, set: setSymbols },
              ].map(opt => (
                <label key={opt.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opt.val}
                    onChange={e => opt.set(e.target.checked)}
                    className="w-4 h-4 accent-brand-600"
                  />
                  <span className="text-sm font-mono">{opt.label}</span>
                </label>
              ))}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noAmbiguous}
                  onChange={e => setNoAmbiguous(e.target.checked)}
                  className="w-4 h-4 accent-brand-600"
                />
                <span className="text-sm">Exclude ambiguous (0, O, l, 1, I)</span>
              </label>
            </div>

            {/* Count */}
            <div className="flex items-center gap-3">
              <label className="label mb-0 shrink-0">Generate</label>
              <input
                type="number" min={1} max={50}
                value={count}
                onChange={e => setCount(Math.min(50, Math.max(1, +e.target.value)))}
                className="input w-20 py-1.5"
              />
              <span className="text-sm text-slate-400">passwords</span>
            </div>
          </div>

          {/* Entropy display */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-brand-500" />
              <span className="font-semibold text-sm">Strength Analysis</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-bold ${bits >= 60 ? 'text-green-600 dark:text-green-400' : bits >= 36 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500'}`}>{str.label}</span>
                <span className="text-slate-400 font-mono">{bits} bits</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full ${str.color} ${str.width} rounded-full transition-all duration-500`} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <div>Charset size: <span className="font-mono text-slate-600 dark:text-slate-300">{cs}</span></div>
                <div>Characters: <span className="font-mono text-slate-600 dark:text-slate-300">{charsetPreview}</span></div>
                <div className="col-span-2 text-slate-400">
                  Entropy = length × log₂(charset) = {length} × log₂({cs}) ≈ {bits} bits
                </div>
              </div>
            </div>
          </div>

          <button className="btn-primary w-full justify-center" onClick={generate}>
            <RefreshCw size={16} /> Generate Passwords
          </button>
        </div>

        {/* Output */}
        <div className="space-y-3">
          {passwords.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <label className="label mb-0">Generated Passwords</label>
                <button className="btn-secondary py-1" onClick={copyAll}>
                  {copied === 'all' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  Copy All
                </button>
              </div>
              <div className="space-y-2">
                {passwords.map((pw, i) => (
                  <div key={i} className="card p-3 flex items-center gap-3 group">
                    <code className="flex-1 text-sm font-mono break-all text-slate-800 dark:text-slate-200 select-all">
                      {pw}
                    </code>
                    <button
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => copy(pw, `pw-${i}`)}
                    >
                      {copied === `pw-${i}` ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Bulk text area */}
              {passwords.length > 1 && (
                <div>
                  <label className="label">All passwords (text)</label>
                  <textarea
                    readOnly
                    className="textarea font-mono text-xs select-all"
                    rows={passwords.length}
                    value={passwords.join('\n')}
                  />
                </div>
              )}
            </>
          )}

          {passwords.length === 0 && (
            <div className="card p-8 text-center text-slate-400 border-dashed flex flex-col items-center gap-3">
              <Lock size={48} className="opacity-20" />
              <p className="text-sm">Click "Generate Passwords" to get started</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
