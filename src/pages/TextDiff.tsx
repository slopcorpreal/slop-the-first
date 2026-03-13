import { useState, useMemo } from 'react'
import { diffWords, diffLines } from 'diff'
import type { Change } from 'diff'
import { GitCompare, Copy, Check } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

const LEFT_SAMPLE = `function greet(name) {
  const message = "Hello, " + name;
  console.log(message);
  return message;
}

const users = ["Alice", "Bob", "Charlie"];
users.forEach(user => greet(user));`

const RIGHT_SAMPLE = `function greet(name, greeting = "Hello") {
  const message = \`\${greeting}, \${name}!\`;
  console.log(message);
  return message;
}

const users = ["Alice", "Bob", "Charlie", "Diana"];
users.forEach(user => greet(user));
console.log("Done!");`

export default function TextDiff() {
  const [left, setLeft] = useState(LEFT_SAMPLE)
  const [right, setRight] = useState(RIGHT_SAMPLE)
  const [mode, setMode] = useState<'words' | 'lines'>('lines')
  const [copied, setCopied] = useState('')

  const { leftHtml, rightHtml, stats } = useMemo(() => {
    const changes: Change[] = mode === 'words'
      ? diffWords(left, right)
      : diffLines(left, right)

    let leftHtml = ''
    let rightHtml = ''
    let added = 0, removed = 0

    for (const part of changes) {
      const text = part.value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

      if (part.added) {
        added += (part.value.match(/\n/g) || [part.value]).length
        rightHtml += `<span class="bg-green-200 dark:bg-green-900/60 text-green-900 dark:text-green-100">${text}</span>`
      } else if (part.removed) {
        removed += (part.value.match(/\n/g) || [part.value]).length
        leftHtml += `<span class="bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-100 line-through">${text}</span>`
      } else {
        leftHtml += `<span>${text}</span>`
        rightHtml += `<span>${text}</span>`
      }
    }

    return { leftHtml, rightHtml, stats: { added, removed } }
  }, [left, right, mode])

  const copy = async (val: string, key: string) => {
    await navigator.clipboard.writeText(val)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const swap = () => {
    const tmp = left
    setLeft(right)
    setRight(tmp)
  }

  return (
    <ToolLayout
      title="Text Diff"
      description="Compare two blocks of text side-by-side with highlighted additions and deletions."
      icon={GitCompare}
      iconColor="from-teal-500 to-cyan-600"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
          {(['lines', 'words'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 text-sm capitalize transition-colors ${mode === m ? 'bg-brand-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              {m}
            </button>
          ))}
        </div>
        <button className="btn-secondary py-1.5 text-sm" onClick={swap}>↔ Swap</button>
        <div className="ml-auto flex gap-3 text-sm">
          {stats.added > 0 && <span className="badge-green">+{stats.added} added</span>}
          {stats.removed > 0 && <span className="badge text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50">-{stats.removed} removed</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              Original
            </label>
            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded" onClick={() => copy(left, 'left')}>
              {copied === 'left' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
          <textarea
            className="textarea min-h-[300px] text-xs leading-relaxed"
            value={left}
            onChange={e => setLeft(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Right */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="label mb-0 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              Modified
            </label>
            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded" onClick={() => copy(right, 'right')}>
              {copied === 'right' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
          <textarea
            className="textarea min-h-[300px] text-xs leading-relaxed"
            value={right}
            onChange={e => setRight(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Left diff */}
        <div>
          <label className="label text-red-500 dark:text-red-400">Deletions highlighted</label>
          <div
            className="min-h-[300px] p-3 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg whitespace-pre-wrap leading-relaxed overflow-auto"
            dangerouslySetInnerHTML={{ __html: leftHtml }}
          />
        </div>

        {/* Right diff */}
        <div>
          <label className="label text-green-600 dark:text-green-400">Additions highlighted</label>
          <div
            className="min-h-[300px] p-3 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg whitespace-pre-wrap leading-relaxed overflow-auto"
            dangerouslySetInnerHTML={{ __html: rightHtml }}
          />
        </div>
      </div>
    </ToolLayout>
  )
}
