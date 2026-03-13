import { useState, useMemo } from 'react'
import { Type, Copy, Check } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

const SAMPLE = `The quick brown fox jumps over the lazy dog.

WebAssembly (abbreviated Wasm) is a binary instruction format for a stack-based virtual machine. Wasm is designed as a portable compilation target for programming languages, enabling deployment on the web for client and server applications.

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`

// Flesch Reading Ease ≈ 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length <= 3) return 1
  word = word.replace(/(?:[^laeiouy]|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')
  const m = word.match(/[aeiouy]{1,2}/g)
  return m ? m.length : 1
}

function fleschLabel(score: number): { label: string; desc: string; color: string } {
  if (score >= 90) return { label: 'Very Easy', desc: '5th grade', color: 'text-green-600 dark:text-green-400' }
  if (score >= 80) return { label: 'Easy', desc: '6th grade', color: 'text-green-500 dark:text-green-400' }
  if (score >= 70) return { label: 'Fairly Easy', desc: '7th grade', color: 'text-lime-600 dark:text-lime-400' }
  if (score >= 60) return { label: 'Standard', desc: '8–9th grade', color: 'text-yellow-600 dark:text-yellow-400' }
  if (score >= 50) return { label: 'Fairly Difficult', desc: '10–12th grade', color: 'text-orange-600 dark:text-orange-400' }
  if (score >= 30) return { label: 'Difficult', desc: 'College', color: 'text-red-500' }
  return { label: 'Very Confusing', desc: 'Professional', color: 'text-red-700 dark:text-red-400' }
}

function analyze(text: string) {
  if (!text.trim()) return null

  const chars = text.length
  const charsNoSpace = text.replace(/\s/g, '').length
  const words = text.trim().split(/\s+/).filter(Boolean)
  const wordCount = words.length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCount = sentences.length
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  const lines = text.split(/\n/).length

  // Reading time at 200-238 WPM (avg)
  const readingTimeSec = Math.ceil((wordCount / 238) * 60)
  const speakingTimeSec = Math.ceil((wordCount / 130) * 60)

  function formatTime(s: number) {
    if (s < 60) return `${s}s`
    const m = Math.floor(s / 60)
    const rem = s % 60
    return `${m}m ${rem > 0 ? rem + 's' : ''}`
  }

  // Avg word length
  const avgWordLen = wordCount > 0 ? (words.reduce((sum, w) => sum + w.replace(/[^a-zA-Z]/g, '').length, 0) / wordCount) : 0

  // Avg sentence length
  const avgSentLen = sentenceCount > 0 ? wordCount / sentenceCount : 0

  // Syllable count
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0)

  // Flesch Reading Ease
  const flesch = sentenceCount > 0 && wordCount > 0
    ? Math.round(206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount))
    : null

  // Word frequency
  const freq: Record<string, number> = {}
  for (const w of words) {
    const clean = w.toLowerCase().replace(/[^a-z0-9']/g, '')
    if (clean.length > 2) freq[clean] = (freq[clean] || 0) + 1
  }
  const topWords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)

  // Unique words
  const uniqueWords = Object.keys(freq).length

  return {
    chars, charsNoSpace, wordCount, sentenceCount, paragraphs: paragraphs.length,
    lines, avgWordLen, avgSentLen, syllables, flesch, topWords, uniqueWords,
    readingTime: formatTime(readingTimeSec), speakingTime: formatTime(speakingTimeSec),
    longestWord: words.reduce((a, b) => a.length > b.length ? a : b, ''),
  }
}

export default function WordCounter() {
  const [text, setText] = useState(SAMPLE)
  const [copied, setCopied] = useState(false)
  const stats = useMemo(() => analyze(text), [text])

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const flesch = stats?.flesch
  const flInfo = flesch !== null && flesch !== undefined ? fleschLabel(flesch) : null

  return (
    <ToolLayout
      title="Word Counter"
      description="Count words, characters, sentences, paragraphs. Readability score, reading time, and top word frequency."
      icon={Type}
      iconColor="from-teal-500 to-cyan-600"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <label className="label mb-0">Your Text</label>
            <div className="flex items-center gap-2">
              <button className="btn-secondary py-1 text-xs" onClick={copy}>
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                Copy
              </button>
              <button className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-500" onClick={() => setText('')}>
                Clear
              </button>
            </div>
          </div>
          <textarea
            className="textarea min-h-[400px] resize-y"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Start typing or paste text here…"
          />

          {/* Top words */}
          {stats && stats.topWords.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-sm mb-3">Top Words</h3>
              <div className="space-y-1.5">
                {stats.topWords.map(([word, count]) => (
                  <div key={word} className="flex items-center gap-2">
                    <span className="text-sm font-mono w-24 truncate text-slate-700 dark:text-slate-300">{word}</span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full"
                        style={{ width: `${(count / stats.topWords[0][1]) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-4">
          {stats ? (
            <>
              {/* Key stats grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Words', value: stats.wordCount.toLocaleString() },
                  { label: 'Characters', value: stats.chars.toLocaleString() },
                  { label: 'No spaces', value: stats.charsNoSpace.toLocaleString() },
                  { label: 'Sentences', value: stats.sentenceCount.toLocaleString() },
                  { label: 'Paragraphs', value: stats.paragraphs.toLocaleString() },
                  { label: 'Lines', value: stats.lines.toLocaleString() },
                  { label: 'Unique words', value: stats.uniqueWords.toLocaleString() },
                  { label: 'Syllables', value: stats.syllables.toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="card p-3 text-center">
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Time estimates */}
              <div className="card p-4 space-y-2">
                <h3 className="font-semibold text-sm">Time Estimates</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">📖 Reading time</span>
                  <span className="font-mono font-semibold">{stats.readingTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">🎙️ Speaking time</span>
                  <span className="font-mono font-semibold">{stats.speakingTime}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Avg word length</span>
                  <span className="font-mono font-semibold">{stats.avgWordLen.toFixed(1)} chars</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Avg sentence length</span>
                  <span className="font-mono font-semibold">{stats.avgSentLen.toFixed(1)} words</span>
                </div>
                {stats.longestWord && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Longest word</span>
                    <span className="font-mono font-semibold truncate max-w-[120px]">{stats.longestWord}</span>
                  </div>
                )}
              </div>

              {/* Readability */}
              {flesch !== null && flInfo && (
                <div className="card p-4 space-y-2">
                  <h3 className="font-semibold text-sm">Readability (Flesch)</h3>
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${flInfo.color}`}>{flesch}</span>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${flInfo.color}`}>{flInfo.label}</p>
                      <p className="text-xs text-slate-400">{flInfo.desc}</p>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, Math.min(100, flesch ?? 0))}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">Scale: 0 (hardest) → 100 (easiest)</p>
                </div>
              )}
            </>
          ) : (
            <div className="card p-8 text-center text-slate-400 border-dashed">
              <Type size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Start typing to see statistics</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
