import { Link } from 'react-router-dom'
import {
  Video, ImageOff, FileImage, QrCode, Braces, Binary,
  TestTube, FileText, Hash, Clock, Link2, GitCompare,
  Palette, Wand2, Zap, Shield, Globe
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Tool {
  path: string
  label: string
  description: string
  icon: LucideIcon
  gradient: string
  badge?: string
  tags: string[]
}

const tools: Tool[] = [
  {
    path: '/video-converter',
    label: 'Video Converter',
    description: 'Convert, compress, and process video files using FFmpeg WASM — all in your browser.',
    icon: Video,
    gradient: 'from-red-500 to-orange-500',
    badge: 'FFmpeg WASM',
    tags: ['mp4', 'webm', 'gif', 'compress'],
  },
  {
    path: '/background-remover',
    label: 'Background Remover',
    description: 'Remove image backgrounds instantly with AI-powered ONNX inference running locally.',
    icon: ImageOff,
    gradient: 'from-purple-500 to-pink-500',
    badge: 'AI WASM',
    tags: ['remove bg', 'transparent', 'png'],
  },
  {
    path: '/image-compressor',
    label: 'Image Compressor',
    description: 'Compress and resize images with real-time quality preview. JPEG, PNG, WebP support.',
    icon: FileImage,
    gradient: 'from-blue-500 to-cyan-500',
    tags: ['jpeg', 'png', 'webp', 'resize'],
  },
  {
    path: '/color-palette',
    label: 'Color Palette Extractor',
    description: 'Extract dominant colors from any image and export as CSS variables, HEX, or JSON.',
    icon: Palette,
    gradient: 'from-pink-500 to-rose-500',
    tags: ['colors', 'palette', 'design', 'css'],
  },
  {
    path: '/json-formatter',
    label: 'JSON Formatter',
    description: 'Format, validate, minify, and explore JSON with syntax highlighting and path navigation.',
    icon: Braces,
    gradient: 'from-yellow-500 to-amber-500',
    tags: ['json', 'format', 'validate', 'minify'],
  },
  {
    path: '/regex-tester',
    label: 'Regex Tester',
    description: 'Test regular expressions with live highlighting, match groups, and replace preview.',
    icon: TestTube,
    gradient: 'from-green-500 to-emerald-500',
    tags: ['regex', 'pattern', 'match', 'test'],
  },
  {
    path: '/markdown-editor',
    label: 'Markdown Editor',
    description: 'Write Markdown with live preview, export to HTML, GitHub Flavored Markdown support.',
    icon: FileText,
    gradient: 'from-slate-500 to-slate-700',
    tags: ['markdown', 'editor', 'preview', 'html'],
  },
  {
    path: '/text-diff',
    label: 'Text Diff',
    description: 'Compare two blocks of text side-by-side with highlighted insertions and deletions.',
    icon: GitCompare,
    gradient: 'from-teal-500 to-cyan-600',
    tags: ['diff', 'compare', 'text', 'patch'],
  },
  {
    path: '/hash-generator',
    label: 'Hash Generator',
    description: 'Generate MD5, SHA-1, SHA-256, SHA-512 hashes from text or files using Web Crypto.',
    icon: Hash,
    gradient: 'from-indigo-500 to-violet-500',
    tags: ['hash', 'sha256', 'md5', 'crypto'],
  },
  {
    path: '/base64',
    label: 'Base64 Encoder',
    description: 'Encode and decode Base64, Base64URL. Supports text and binary files.',
    icon: Binary,
    gradient: 'from-orange-500 to-red-500',
    tags: ['base64', 'encode', 'decode'],
  },
  {
    path: '/url-encoder',
    label: 'URL Encoder',
    description: 'Encode/decode URLs, parse query strings, and build URLs with visual param editor.',
    icon: Link2,
    gradient: 'from-cyan-500 to-blue-500',
    tags: ['url', 'encode', 'query', 'params'],
  },
  {
    path: '/qr-generator',
    label: 'QR Code Generator',
    description: 'Generate QR codes for URLs, text, contacts, WiFi. Download as PNG or SVG.',
    icon: QrCode,
    gradient: 'from-gray-700 to-gray-900',
    tags: ['qr', 'qrcode', 'barcode'],
  },
  {
    path: '/timestamp',
    label: 'Timestamp Converter',
    description: 'Convert between Unix timestamps, ISO dates, and human-readable formats across timezones.',
    icon: Clock,
    gradient: 'from-blue-600 to-indigo-600',
    tags: ['timestamp', 'unix', 'date', 'timezone'],
  },
  {
    path: '/css-gradient',
    label: 'CSS Gradient Generator',
    description: 'Build beautiful linear and radial gradients with a visual editor and instant CSS output.',
    icon: Wand2,
    gradient: 'from-pink-600 to-purple-600',
    tags: ['css', 'gradient', 'color', 'design'],
  },
]

const features = [
  { icon: Shield, title: 'Privacy First', desc: 'Everything runs in your browser. No uploads, no server-side processing, no tracking.' },
  { icon: Zap, title: 'Lightning Fast', desc: 'WebAssembly-powered tools for near-native performance without leaving your browser.' },
  { icon: Globe, title: 'Always Free', desc: 'No subscriptions, no limits, no watermarks. Use all tools unlimited times, forever.' },
]

export default function Home() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4 py-8 animate-slide-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-sm font-medium mb-2">
          <Zap size={14} />
          100% browser-based · No uploads required
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold">
          The{' '}
          <span className="text-gradient">Tool Suite</span>
          {' '}you've been waiting for
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          {tools.length} powerful tools for developers, designers, and creators.
          Powered by WebAssembly, AI, and the Web Platform — completely free and private.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {['FFmpeg WASM', 'AI Background Removal', 'Web Crypto API', 'No Sign-up', 'Open Source'].map(t => (
            <span key={t} className="badge-blue">{t}</span>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {features.map(f => (
          <div key={f.title} className="card p-5 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
              <f.icon size={20} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tools Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-6">All Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map(tool => (
            <Link
              key={tool.path}
              to={tool.path}
              className="card p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                  <tool.icon size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{tool.label}</h3>
                    {tool.badge && (
                      <span className="badge-purple text-xs">{tool.badge}</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {tool.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-auto">
                {tool.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 pt-8 pb-4 text-center text-sm text-slate-400 dark:text-slate-500">
        <p>
          Built with ❤️ using React, Vite, FFmpeg WASM, and ONNX Runtime ·{' '}
          <a
            href="https://github.com/slopcorpreal/slop-the-first"
            className="text-brand-500 hover:text-brand-600 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}
