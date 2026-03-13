import { useState, useMemo } from 'react'
import { TestTube, Copy, Check, AlertCircle } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

const EXAMPLES = [
  { name: 'Email', pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}', flags: 'gi' },
  { name: 'URL', pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&\\/\\/=]*)', flags: 'gi' },
  { name: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  { name: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])', flags: 'g' },
  { name: 'Hex Color', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b', flags: 'gi' },
  { name: 'Phone (US)', pattern: '(?:\\+1)?[-. ]?\\(?\\d{3}\\)?[-. ]?\\d{3}[-. ]?\\d{4}', flags: 'g' },
  { name: 'Zip Code', pattern: '\\b\\d{5}(?:-\\d{4})?\\b', flags: 'g' },
  { name: 'Credit Card', pattern: '\\b(?:\\d{4}[- ]){3}\\d{4}\\b', flags: 'g' },
]

const COLORS = ['#fde68a','#bbf7d0','#bfdbfe','#fecaca','#ddd6fe','#fed7aa','#cffafe','#f9a8d4']
const MAX_PATTERN_LENGTH = 200
const MAX_TEST_STRING_LENGTH = 20000
const MAX_MATCHES = 2000

function hasCommonBacktrackingPatterns(pattern: string) {
  const nestedQuantifiers = /\((?:[^()\\]|\\.)*[+*](?:[^()\\]|\\.)*\)[+*{]/
  const overlappingGreedyGroups = /\((?:[^()\\]|\\.)+\)(?:\+|\*)\+/
  return nestedQuantifiers.test(pattern) || overlappingGreedyGroups.test(pattern)
}

export default function RegexTester() {
  const [pattern, setPattern] = useState('[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}')
  const [flags, setFlags] = useState('gi')
  const [testStr, setTestStr] = useState('Contact us at support@example.com or sales@company.org for help. Invalid: not-an-email, @missing.com')
  const [replace, setReplace] = useState('')
  const [copied, setCopied] = useState(false)

  const { matches, highlighted, error, replaceResult } = useMemo(() => {
    if (!pattern) return { matches: [], highlighted: testStr, error: '', groups: [], replaceResult: '' }
    if (pattern.length > MAX_PATTERN_LENGTH) {
      return {
        matches: [],
        highlighted: testStr,
        error: `Pattern is too long (${pattern.length}). Max supported length is ${MAX_PATTERN_LENGTH}.`,
        groups: [],
        replaceResult: ''
      }
    }
    if (testStr.length > MAX_TEST_STRING_LENGTH) {
      return {
        matches: [],
        highlighted: testStr,
        error: `Test string is too long (${testStr.length}). Max supported length is ${MAX_TEST_STRING_LENGTH}.`,
        groups: [],
        replaceResult: ''
      }
    }
    if (hasCommonBacktrackingPatterns(pattern)) {
      return {
        matches: [],
        highlighted: testStr,
        error: 'Pattern contains common catastrophic backtracking patterns.',
        groups: [],
        replaceResult: ''
      }
    }
    try {
      const re = new RegExp(pattern, flags)
      const matches: RegExpExecArray[] = []
      if (flags.includes('g')) {
        let m: RegExpExecArray | null
        const re2 = new RegExp(pattern, flags)
        while ((m = re2.exec(testStr)) !== null) {
          matches.push(m)
          if (matches.length >= MAX_MATCHES) break
          if (m.index === re2.lastIndex) re2.lastIndex++
        }
      } else {
        const m = re.exec(testStr)
        if (m) matches.push(m)
      }

      // Highlight
      let result = ''
      let lastIdx = 0
      const re3 = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
      let idx = 0
      testStr.replace(re3, (m, ...args) => {
        const offset = args[args.length - 2] as number
        const esc = testStr.slice(lastIdx, offset).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        const mEsc = m.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        const bg = COLORS[idx % COLORS.length]
        result += `${esc}<mark style="background:${bg};color:#000;border-radius:2px;padding:0 1px">${mEsc}</mark>`
        lastIdx = offset + m.length
        idx++
        return m
      })
      result += testStr.slice(lastIdx).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

      const groups = matches[0]?.slice(1) || []
      const replaceResult = replace ? testStr.replace(new RegExp(pattern, flags), replace) : ''

      return { matches, highlighted: result, error: '', groups, replaceResult }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e)
      return { matches: [], highlighted: testStr, error: errorMessage, groups: [], replaceResult: '' }
    }
  }, [pattern, flags, testStr, replace])

  const copy = async () => {
    await navigator.clipboard.writeText(`/${pattern}/${flags}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ToolLayout
      title="Regex Tester"
      description="Test regular expressions with live highlighting, match groups, and replace preview."
      icon={TestTube}
      iconColor="from-green-500 to-emerald-500"
    >
      <div className="space-y-4">
        {/* Pattern input */}
        <div className="card p-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="label">Pattern</label>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-500">
                <span className="px-2 text-slate-400 font-mono">/</span>
                <input
                  type="text"
                  className="flex-1 py-2 bg-transparent outline-none font-mono text-sm"
                  value={pattern}
                  onChange={e => setPattern(e.target.value)}
                  placeholder="regex pattern"
                  spellCheck={false}
                />
                <span className="px-1 text-slate-400 font-mono">/</span>
                <input
                  type="text"
                  className="w-16 py-2 bg-transparent outline-none font-mono text-sm border-l border-slate-200 dark:border-slate-600 px-2"
                  value={flags}
                  onChange={e => setFlags(e.target.value)}
                  placeholder="flags"
                />
              </div>
            </div>
            <div className="self-end">
              <button className="btn-secondary h-[38px]" onClick={copy}>
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Quick examples */}
          <div className="flex flex-wrap gap-1">
            {EXAMPLES.map(ex => (
              <button
                key={ex.name}
                onClick={() => { setPattern(ex.pattern); setFlags(ex.flags) }}
                className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
              >
                {ex.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Test string */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Test String</label>
                <span className={`badge ${matches.length > 0 ? 'badge-green' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                  {matches.length} match{matches.length !== 1 ? 'es' : ''}
                </span>
              </div>
              <textarea
                className="textarea min-h-[200px]"
                value={testStr}
                onChange={e => setTestStr(e.target.value)}
                placeholder="Enter text to test against…"
                spellCheck={false}
              />
            </div>

            {/* Replace */}
            <div>
              <label className="label">Replace with (optional)</label>
              <input type="text" className="input font-mono" value={replace} onChange={e => setReplace(e.target.value)} placeholder="replacement string (use $1, $2 for groups)" />
            </div>
            {replaceResult && (
              <div className="card p-3">
                <p className="text-xs font-medium text-slate-500 mb-1">Replace Result</p>
                <p className="text-sm font-mono whitespace-pre-wrap">{replaceResult}</p>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="space-y-3">
            <div>
              <label className="label">Highlighted Matches</label>
              <div
                className="min-h-[200px] p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg font-mono text-sm whitespace-pre-wrap break-all leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </div>

            {matches.length > 0 && (
              <div className="card p-3 space-y-2 max-h-48 overflow-auto">
                <p className="text-xs font-semibold text-slate-500">Matches</p>
                {matches.slice(0, 20).map((m, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: COLORS[i % COLORS.length], color: '#000' }}>
                      {i + 1}
                    </span>
                    <div>
                      <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">{m[0]}</code>
                      <span className="text-xs text-slate-400 ml-2">@ index {m.index}</span>
                      {m.length > 1 && (
                        <div className="text-xs text-slate-400">
                          Groups: {m.slice(1).map((g, gi) => <code key={gi} className="bg-slate-100 dark:bg-slate-800 px-1 rounded mx-0.5">{g ?? 'undefined'}</code>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {matches.length > 20 && <p className="text-xs text-slate-400">…and {matches.length - 20} more</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
