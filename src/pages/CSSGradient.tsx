import { useState, useMemo } from 'react'
import { Wand2, Copy, Check, Plus, Trash2 } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

interface Stop { color: string; position: number }

const PRESETS = [
  { name: 'Sunset', stops: [{ color: '#f97316', position: 0 }, { color: '#ec4899', position: 50 }, { color: '#8b5cf6', position: 100 }] },
  { name: 'Ocean', stops: [{ color: '#06b6d4', position: 0 }, { color: '#3b82f6', position: 100 }] },
  { name: 'Forest', stops: [{ color: '#22c55e', position: 0 }, { color: '#14b8a6', position: 100 }] },
  { name: 'Fire', stops: [{ color: '#fbbf24', position: 0 }, { color: '#f97316', position: 50 }, { color: '#ef4444', position: 100 }] },
  { name: 'Night', stops: [{ color: '#1e1b4b', position: 0 }, { color: '#312e81', position: 50 }, { color: '#4f46e5', position: 100 }] },
  { name: 'Aurora', stops: [{ color: '#10b981', position: 0 }, { color: '#3b82f6', position: 50 }, { color: '#a855f7', position: 100 }] },
  { name: 'Cotton Candy', stops: [{ color: '#fbcfe8', position: 0 }, { color: '#e9d5ff', position: 100 }] },
  { name: 'Gold', stops: [{ color: '#fde68a', position: 0 }, { color: '#d97706', position: 100 }] },
]

export default function CSSGradient() {
  const [type, setType] = useState<'linear' | 'radial' | 'conic'>('linear')
  const [angle, setAngle] = useState(135)
  const [stops, setStops] = useState<Stop[]>([
    { color: '#f97316', position: 0 },
    { color: '#ec4899', position: 50 },
    { color: '#8b5cf6', position: 100 },
  ])
  const [copied, setCopied] = useState(false)

  const gradientStr = useMemo(() => {
    const stopStr = stops.sort((a, b) => a.position - b.position).map(s => `${s.color} ${s.position}%`).join(', ')
    switch (type) {
      case 'linear': return `linear-gradient(${angle}deg, ${stopStr})`
      case 'radial': return `radial-gradient(circle, ${stopStr})`
      case 'conic': return `conic-gradient(from ${angle}deg, ${stopStr})`
    }
  }, [type, angle, stops])

  const cssStr = `background: ${gradientStr};`

  const copy = async () => {
    await navigator.clipboard.writeText(cssStr)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const addStop = () => {
    const pos = stops.length ? Math.round((stops[0].position + stops[stops.length - 1].position) / 2) : 50
    setStops([...stops, { color: '#6366f1', position: pos }].sort((a, b) => a.position - b.position))
  }

  return (
    <ToolLayout
      title="CSS Gradient Generator"
      description="Build beautiful linear, radial, and conic gradients with a visual editor and instant CSS output."
      icon={Wand2}
      iconColor="from-pink-600 to-purple-600"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          {/* Type */}
          <div className="card p-4 space-y-3">
            <div>
              <label className="label">Gradient Type</label>
              <div className="flex gap-1">
                {(['linear', 'radial', 'conic'] as const).map(t => (
                  <button key={t} onClick={() => setType(t)} className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-colors border ${type === t ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 dark:border-slate-600 hover:border-brand-400'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {(type === 'linear' || type === 'conic') && (
              <div>
                <label className="label">Angle: {angle}°</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={360} value={angle} onChange={e => setAngle(+e.target.value)} className="flex-1 accent-brand-600" />
                  <input type="number" min={0} max={360} value={angle} onChange={e => setAngle(+e.target.value)} className="input w-16 text-sm" />
                </div>
              </div>
            )}
          </div>

          {/* Stops */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Color Stops</label>
              <button className="btn-secondary py-1 px-2 text-xs" onClick={addStop}>
                <Plus size={12} /> Add Stop
              </button>
            </div>
            <div className="space-y-2">
              {stops.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={s.color}
                    onChange={e => setStops(ss => ss.map((st, si) => si === i ? { ...st, color: e.target.value } : st))}
                    className="w-10 h-9 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={s.color}
                    onChange={e => setStops(ss => ss.map((st, si) => si === i ? { ...st, color: e.target.value } : st))}
                    className="input w-28 font-mono text-sm"
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={s.position}
                    onChange={e => setStops(ss => ss.map((st, si) => si === i ? { ...st, position: +e.target.value } : st))}
                    className="flex-1 accent-brand-600"
                  />
                  <span className="text-xs text-slate-400 w-8 text-right">{s.position}%</span>
                  {stops.length > 2 && (
                    <button className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-400" onClick={() => setStops(ss => ss.filter((_, si) => si !== i))}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div className="card p-4 space-y-2">
            <label className="label">Presets</label>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map(p => {
                const grad = `linear-gradient(135deg, ${p.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
                return (
                  <button
                    key={p.name}
                    onClick={() => setStops([...p.stops])}
                    title={p.name}
                    className="h-10 rounded-lg shadow-sm hover:scale-105 transition-transform border-2 border-transparent hover:border-white"
                    style={{ background: grad }}
                  />
                )
              })}
            </div>
            <div className="flex flex-wrap gap-1">
              {PRESETS.map(p => (
                <button key={p.name} onClick={() => setStops([...p.stops])} className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors">
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview & Output */}
        <div className="space-y-4">
          {/* Preview */}
          <div
            className="rounded-2xl shadow-lg min-h-48 lg:min-h-64"
            style={{ background: gradientStr }}
          />

          {/* CSS Output */}
          <div className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="label mb-0">CSS</label>
              <button className="btn-secondary py-1.5 px-3 text-sm" onClick={copy}>
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />} Copy
              </button>
            </div>
            <div className="code-block text-xs leading-relaxed">
              <span className="text-blue-400">background</span>
              <span className="text-slate-400">: </span>
              <span className="text-green-400">{gradientStr}</span>
              <span className="text-slate-400">;</span>
            </div>
          </div>

          {/* Tailwind */}
          <div className="card p-4 space-y-2">
            <label className="label mb-0">Usage Examples</label>
            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
                <span className="text-slate-400">/* React inline style */</span><br />
                <span className="text-blue-400">style</span>=&#123;&#123; <span className="text-green-400">background: "{gradientStr}"</span> &#125;&#125;
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
                <span className="text-slate-400">/* CSS */</span><br />
                <span className="text-blue-400">.element</span> &#123;<br />
                &nbsp;&nbsp;<span className="text-red-400">background</span>: <span className="text-green-400">{gradientStr}</span>;<br />
                &#125;
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
