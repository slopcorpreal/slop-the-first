import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  description: string
  icon: LucideIcon
  iconColor?: string
  badge?: string
  badgeColor?: string
  children: ReactNode
}

export default function ToolLayout({
  title, description, icon: Icon, iconColor = 'from-brand-500 to-purple-600',
  badge, badgeColor = 'badge-blue', children
}: Props) {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-4 transition-colors">
          <ChevronLeft size={16} />
          All Tools
        </Link>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 bg-gradient-to-br ${iconColor} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
            <Icon size={24} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold">{title}</h1>
              {badge && <span className={badgeColor}>{badge}</span>}
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
