import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileText, Copy, Check, Download, Eye, Edit2, Columns } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

const DEFAULT_MD = `# Welcome to Markdown Editor

A **powerful** markdown editor with *live preview* and GitHub Flavored Markdown support.

## Features

- [x] Live preview
- [x] GitHub Flavored Markdown (GFM)
- [x] Tables, checkboxes, strikethrough
- [ ] Export to HTML
- [ ] Export to Markdown file

## Code

\`\`\`typescript
interface User {
  id: number
  name: string
  email: string
}

const greet = (user: User): string => {
  return \`Hello, \${user.name}!\`
}
\`\`\`

## Table

| Feature | Status | Notes |
|---------|--------|-------|
| Editor | ✅ | Monaco-like experience |
| Preview | ✅ | Real-time rendering |
| Export | ✅ | HTML & MD formats |
| Dark mode | ✅ | Auto-detected |

## Blockquote

> "The best tool is the one you actually use."
> — Some wise developer

## Links & Images

Visit [ToolKit](https://slopcorpreal.github.io/slop-the-first/) for more tools.

---

*Made with ❤️ in the browser*
`

export default function MarkdownEditor() {
  const [md, setMd] = useState(DEFAULT_MD)
  const [view, setView] = useState<'split' | 'edit' | 'preview'>('split')
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadMd = () => {
    const blob = new Blob([md], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'document.md'
    a.click()
  }

  const downloadHtml = () => {
    const tempDiv = document.createElement('div')
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Document</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #333; }
  code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
  pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow-x: auto; }
  pre code { background: none; color: inherit; }
  blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f8f8f8; }
  img { max-width: 100%; }
  hr { border: none; border-top: 1px solid #eee; }
</style>
</head>
<body>
${tempDiv.innerHTML}
</body>
</html>`
    const blob = new Blob([html], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'document.html'
    a.click()
  }

  return (
    <ToolLayout
      title="Markdown Editor"
      description="Write Markdown with live preview. Supports GitHub Flavored Markdown (GFM) with tables, checkboxes, and more."
      icon={FileText}
      iconColor="from-slate-500 to-slate-700"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600">
          <button onClick={() => setView('edit')} className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${view === 'edit' ? 'bg-brand-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            <Edit2 size={14} /> Edit
          </button>
          <button onClick={() => setView('split')} className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${view === 'split' ? 'bg-brand-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            <Columns size={14} /> Split
          </button>
          <button onClick={() => setView('preview')} className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${view === 'preview' ? 'bg-brand-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            <Eye size={14} /> Preview
          </button>
        </div>
        <div className="ml-auto flex gap-1">
          <button className="btn-secondary py-1.5 px-3 text-sm" onClick={copy}>
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />} Copy MD
          </button>
          <button className="btn-secondary py-1.5 px-3 text-sm" onClick={downloadMd}>
            <Download size={14} /> .md
          </button>
          <button className="btn-secondary py-1.5 px-3 text-sm" onClick={downloadHtml}>
            <Download size={14} /> .html
          </button>
        </div>
      </div>

      <div className={`grid gap-4 ${view === 'split' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {(view === 'edit' || view === 'split') && (
          <div>
            {view === 'split' && <label className="label">Markdown</label>}
            <textarea
              className="textarea min-h-[600px] text-sm leading-relaxed"
              value={md}
              onChange={e => setMd(e.target.value)}
              spellCheck={false}
            />
            <p className="text-xs text-slate-400 mt-1">{md.length} chars · {md.split('\n').length} lines</p>
          </div>
        )}

        {(view === 'preview' || view === 'split') && (
          <div>
            {view === 'split' && <label className="label">Preview</label>}
            <div className="card p-6 min-h-[600px] prose prose-slate dark:prose-invert max-w-none overflow-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {md}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .prose h1 { font-size: 1.8em; font-weight: 800; margin: 0.5em 0; }
        .prose h2 { font-size: 1.4em; font-weight: 700; margin: 1em 0 0.5em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
        .prose h3 { font-size: 1.2em; font-weight: 600; }
        .prose code { font-family: 'JetBrains Mono', monospace; font-size: 0.85em; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
        .dark .prose code { background: #1e293b; }
        .prose pre { background: #1e293b; color: #e2e8f0; padding: 1em; border-radius: 8px; overflow-x: auto; }
        .prose pre code { background: none; padding: 0; color: inherit; }
        .prose blockquote { border-left: 4px solid #6366f1; padding-left: 1em; color: #64748b; font-style: italic; }
        .prose table { width: 100%; border-collapse: collapse; }
        .prose th, .prose td { border: 1px solid #e2e8f0; padding: 8px 12px; }
        .dark .prose th, .dark .prose td { border-color: #334155; }
        .prose th { background: #f8fafc; font-weight: 600; }
        .dark .prose th { background: #1e293b; }
        .prose li input[type="checkbox"] { margin-right: 6px; }
        .prose hr { border-top: 1px solid #e2e8f0; margin: 2em 0; }
        .dark .prose hr { border-color: #334155; }
        .prose a { color: #6366f1; text-decoration: none; }
        .prose a:hover { text-decoration: underline; }
        .prose strong { font-weight: 700; }
        .prose ul { list-style: disc; padding-left: 1.5em; }
        .prose ol { list-style: decimal; padding-left: 1.5em; }
        .prose li { margin: 0.25em 0; }
      `}</style>
    </ToolLayout>
  )
}
