import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, Command } from 'lucide-react'
import {
  Video, ImageOff, FileImage, QrCode, Braces, Binary,
  TestTube, FileText, Hash, Clock, Link2, GitCompare,
  Palette, Wand2, KeyRound, Lock, Fingerprint,
  Hash as HashIcon, Type, Calendar, Pipette
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface ToolEntry {
  path: string
  label: string
  keywords: string[]
  icon: LucideIcon
  category: string
}

const ALL_TOOLS: ToolEntry[] = [
  { path: '/video-converter', label: 'Video Converter', keywords: ['video', 'mp4', 'webm', 'gif', 'ffmpeg', 'convert', 'compress', 'audio', 'mp3'], icon: Video, category: 'Media' },
  { path: '/background-remover', label: 'Background Remover', keywords: ['background', 'remove', 'bg', 'ai', 'transparent', 'png', 'onnx'], icon: ImageOff, category: 'Media' },
  { path: '/image-compressor', label: 'Image Compressor', keywords: ['image', 'compress', 'jpeg', 'png', 'webp', 'resize', 'optimize'], icon: FileImage, category: 'Media' },
  { path: '/color-palette', label: 'Color Palette Extractor', keywords: ['color', 'palette', 'extract', 'dominant', 'image', 'css'], icon: Palette, category: 'Media' },
  { path: '/color-converter', label: 'Color Converter', keywords: ['color', 'hex', 'rgb', 'hsl', 'hsv', 'convert', 'picker', 'contrast', 'wcag', 'accessibility'], icon: Pipette, category: 'Design' },
  { path: '/css-gradient', label: 'CSS Gradient Generator', keywords: ['css', 'gradient', 'linear', 'radial', 'conic', 'color', 'design'], icon: Wand2, category: 'Design' },
  { path: '/json-formatter', label: 'JSON Formatter', keywords: ['json', 'format', 'validate', 'minify', 'sort', 'pretty', 'parse'], icon: Braces, category: 'Dev' },
  { path: '/jwt', label: 'JWT Debugger', keywords: ['jwt', 'json web token', 'decode', 'header', 'payload', 'auth', 'bearer', 'token'], icon: KeyRound, category: 'Dev' },
  { path: '/regex-tester', label: 'Regex Tester', keywords: ['regex', 'regexp', 'pattern', 'match', 'test', 'replace', 'flags'], icon: TestTube, category: 'Dev' },
  { path: '/markdown-editor', label: 'Markdown Editor', keywords: ['markdown', 'md', 'editor', 'preview', 'html', 'gfm', 'render'], icon: FileText, category: 'Dev' },
  { path: '/text-diff', label: 'Text Diff', keywords: ['diff', 'compare', 'text', 'patch', 'difference', 'change'], icon: GitCompare, category: 'Dev' },
  { path: '/hash-generator', label: 'Hash Generator', keywords: ['hash', 'sha', 'md5', 'sha256', 'sha512', 'crypto', 'checksum'], icon: Hash, category: 'Dev' },
  { path: '/number-base', label: 'Number Base Converter', keywords: ['binary', 'hex', 'octal', 'decimal', 'base', 'convert', 'bitwise', 'bit'], icon: HashIcon, category: 'Dev' },
  { path: '/cron', label: 'Cron Parser', keywords: ['cron', 'schedule', 'crontab', 'job', 'timer', 'recurring'], icon: Calendar, category: 'Dev' },
  { path: '/word-counter', label: 'Word Counter', keywords: ['word', 'count', 'character', 'text', 'reading', 'time', 'flesch', 'readability', 'sentence', 'paragraph'], icon: Type, category: 'Text' },
  { path: '/base64', label: 'Base64 Encoder', keywords: ['base64', 'encode', 'decode', 'binary', 'text', 'file'], icon: Binary, category: 'Encode' },
  { path: '/url-encoder', label: 'URL Encoder', keywords: ['url', 'encode', 'decode', 'query', 'params', 'uri', 'percent'], icon: Link2, category: 'Encode' },
  { path: '/qr-generator', label: 'QR Code Generator', keywords: ['qr', 'qrcode', 'barcode', 'scan', 'url', 'contact', 'wifi'], icon: QrCode, category: 'Generate' },
  { path: '/timestamp', label: 'Timestamp Converter', keywords: ['timestamp', 'unix', 'epoch', 'date', 'time', 'timezone', 'iso'], icon: Clock, category: 'Generate' },
  { path: '/password-generator', label: 'Password Generator', keywords: ['password', 'generate', 'secure', 'random', 'entropy', 'strength', 'crypto'], icon: Lock, category: 'Generate' },
  { path: '/uuid', label: 'UUID Generator', keywords: ['uuid', 'guid', 'unique', 'id', 'identifier', 'v4', 'random'], icon: Fingerprint, category: 'Generate' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_TOOLS
    const q = query.toLowerCase()
    return ALL_TOOLS.filter(t =>
      t.label.toLowerCase().includes(q) ||
      t.keywords.some(k => k.includes(q)) ||
      t.category.toLowerCase().includes(q)
    )
  }, [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setSelected(0)
  }, [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected(s => Math.min(s + 1, filtered.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected(s => Math.max(s - 1, 0))
      }
      if (e.key === 'Enter') {
        if (filtered[selected]) {
          navigate(filtered[selected].path)
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, filtered, selected, navigate, onClose])

  if (!open) return null

  const byCategory = filtered.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {} as Record<string, ToolEntry[]>)

  const go = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-sm placeholder-slate-400"
            placeholder="Search tools…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">↑↓</kbd>
            <span>navigate</span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono ml-1">↵</kbd>
            <span>open</span>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              No tools found for "{query}"
            </div>
          ) : query.trim() ? (
            // Flat list when searching
            filtered.map((tool, i) => {
              const Icon = tool.icon
              return (
                <button
                  key={tool.path}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selected ? 'bg-brand-50 dark:bg-brand-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  onClick={() => go(tool.path)}
                  onMouseEnter={() => setSelected(i)}
                >
                  <Icon size={16} className={`shrink-0 ${i === selected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{tool.label}</span>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{tool.category}</span>
                  {i === selected && <ArrowRight size={14} className="text-brand-500 shrink-0" />}
                </button>
              )
            })
          ) : (
            // Grouped by category
            Object.entries(byCategory).map(([cat, tools]) => (
              <div key={cat}>
                <p className="px-4 py-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {cat}
                </p>
                {tools.map((tool) => {
                  const globalIndex = ALL_TOOLS.indexOf(tool)
                  void 0
                  const Icon = tool.icon
                  return (
                    <button
                      key={tool.path}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${globalIndex === selected ? 'bg-brand-50 dark:bg-brand-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      onClick={() => go(tool.path)}
                      onMouseEnter={() => setSelected(globalIndex)}
                    >
                      <Icon size={16} className={`shrink-0 ${globalIndex === selected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                      <span className="text-sm font-medium flex-1">{tool.label}</span>
                      {globalIndex === selected && <ArrowRight size={14} className="text-brand-500 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Command size={12} />
            <span>{filtered.length} tool{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <button className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" onClick={onClose}>
            Press Esc to close
          </button>
        </div>
      </div>
    </div>
  )
}
