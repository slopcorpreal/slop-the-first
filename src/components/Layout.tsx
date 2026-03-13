import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  Wrench, Moon, Sun, Github, Menu, X, ChevronRight,
  Video, ImageOff, FileImage, QrCode, Braces, Binary,
  TestTube, FileText, Hash, Clock, Link2, GitCompare,
  Palette, Wand2
} from 'lucide-react'

const navItems = [
  { path: '/video-converter', label: 'Video Converter', icon: Video, category: 'Media' },
  { path: '/background-remover', label: 'Background Remover', icon: ImageOff, category: 'Media' },
  { path: '/image-compressor', label: 'Image Compressor', icon: FileImage, category: 'Media' },
  { path: '/color-palette', label: 'Color Palette', icon: Palette, category: 'Media' },
  { path: '/json-formatter', label: 'JSON Formatter', icon: Braces, category: 'Dev' },
  { path: '/regex-tester', label: 'Regex Tester', icon: TestTube, category: 'Dev' },
  { path: '/markdown-editor', label: 'Markdown Editor', icon: FileText, category: 'Dev' },
  { path: '/text-diff', label: 'Text Diff', icon: GitCompare, category: 'Dev' },
  { path: '/hash-generator', label: 'Hash Generator', icon: Hash, category: 'Dev' },
  { path: '/base64', label: 'Base64 Tool', icon: Binary, category: 'Encode' },
  { path: '/url-encoder', label: 'URL Encoder', icon: Link2, category: 'Encode' },
  { path: '/qr-generator', label: 'QR Generator', icon: QrCode, category: 'Generate' },
  { path: '/timestamp', label: 'Timestamp', icon: Clock, category: 'Generate' },
  { path: '/css-gradient', label: 'CSS Gradient', icon: Wand2, category: 'Generate' },
]

function useDarkMode() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.theme = next ? 'dark' : 'light'
  }
  return { dark, toggle }
}

export default function Layout() {
  const location = useLocation()
  const { dark, toggle } = useDarkMode()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const categories = [...new Set(navItems.map(i => i.category))]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-40 h-14 glass bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center h-full px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Wrench size={14} className="text-white" />
            </div>
            <span className="text-gradient">ToolKit</span>
          </Link>
          <div className="flex-1" />
          <nav className="hidden lg:flex items-center gap-1 text-sm">
            <Link to="/" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium">Home</Link>
          </nav>
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a
            href="https://github.com/slopcorpreal/slop-the-first"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="GitHub"
          >
            <Github size={18} />
          </a>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-14 z-30 lg:z-auto w-64 h-[calc(100vh-3.5rem)]
          bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700
          overflow-y-auto transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-3 space-y-4">
            {categories.map(cat => (
              <div key={cat}>
                <p className="px-3 py-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {cat}
                </p>
                <div className="space-y-0.5">
                  {navItems.filter(i => i.category === cat).map(item => {
                    const active = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${active
                            ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                          }
                        `}
                      >
                        <item.icon size={16} className={active ? 'text-brand-600 dark:text-brand-400' : ''} />
                        {item.label}
                        {active && <ChevronRight size={14} className="ml-auto" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
