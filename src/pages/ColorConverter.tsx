import { useState, useMemo } from 'react'
import { Pipette, Copy, Check, Shuffle } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

// ---- Color math ----
function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '')
  const expanded = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null
  const n = parseInt(expanded, 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ]
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const v = max
  const d = max - min
  const s = max === 0 ? 0 : d / max
  let h = 0
  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)]
}

// sRGB luminance for WCAG
function relativeLuminance(r: number, g: number, b: number) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function contrastRatio(r1: number, g1: number, b1: number, r2 = 255, g2 = 255, b2 = 255) {
  const L1 = relativeLuminance(r1, g1, b1)
  const L2 = relativeLuminance(r2, g2, b2)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

// CSS named colors (common subset)
const NAMED_COLORS: Record<string, string> = {
  red: '#ff0000', green: '#008000', blue: '#0000ff', white: '#ffffff',
  black: '#000000', yellow: '#ffff00', orange: '#ffa500', purple: '#800080',
  pink: '#ffc0cb', brown: '#a52a2a', gray: '#808080', grey: '#808080',
  cyan: '#00ffff', magenta: '#ff00ff', lime: '#00ff00', indigo: '#4b0082',
  violet: '#ee82ee', gold: '#ffd700', silver: '#c0c0c0', coral: '#ff7f50',
  salmon: '#fa8072', khaki: '#f0e68c', teal: '#008080', navy: '#000080',
  maroon: '#800000', olive: '#808000', aqua: '#00ffff', fuchsia: '#ff00ff',
  crimson: '#dc143c', turquoise: '#40e0d0', lavender: '#e6e6fa',
  tomato: '#ff6347', hotpink: '#ff69b4', dodgerblue: '#1e90ff',
  forestgreen: '#228b22', steelblue: '#4682b4', royalblue: '#4169e1',
}

function parseColor(input: string): [number, number, number] | null {
  const s = input.trim().toLowerCase()
  // Named
  if (NAMED_COLORS[s]) return hexToRgb(NAMED_COLORS[s])
  // Hex
  if (s.startsWith('#') || /^[0-9a-f]{3,6}$/.test(s)) {
    return hexToRgb(s.startsWith('#') ? s : '#' + s)
  }
  // rgb(r, g, b)
  const rgbMatch = s.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbMatch) return [+rgbMatch[1], +rgbMatch[2], +rgbMatch[3]]
  // hsl(h, s%, l%)
  const hslMatch = s.match(/^hsla?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?/)
  if (hslMatch) return hslToRgb(+hslMatch[1], +hslMatch[2], +hslMatch[3])
  return null
}

function randomColor(): string {
  const bytes = new Uint8Array(3)
  crypto.getRandomValues(bytes)
  return rgbToHex(bytes[0], bytes[1], bytes[2])
}

// Generate a simple tint/shade/complementary palette
function generatePalette(r: number, g: number, b: number) {
  const [h, s, l] = rgbToHsl(r, g, b)
  const tints = [90, 80, 70, 60, 50, 40, 30, 20, 10].map(lightness => ({
    label: `${lightness}%`,
    hex: rgbToHex(...hslToRgb(h, s, lightness)),
  }))
  const complement = rgbToHex(...hslToRgb((h + 180) % 360, s, l))
  const triadic = [
    rgbToHex(...hslToRgb((h + 120) % 360, s, l)),
    rgbToHex(...hslToRgb((h + 240) % 360, s, l)),
  ]
  const analogous = [
    rgbToHex(...hslToRgb((h + 30) % 360, s, l)),
    rgbToHex(...hslToRgb((h - 30 + 360) % 360, s, l)),
  ]
  return { tints, complement, triadic, analogous }
}

export default function ColorConverter() {
  const [input, setInput] = useState('#5b6cf2')
  const [copied, setCopied] = useState<string | null>(null)

  const rgb = useMemo(() => parseColor(input), [input])
  const [r, g, b] = rgb ?? [0, 0, 0]

  const hex = rgb ? rgbToHex(r, g, b) : null
  const [h, sl, l] = rgb ? rgbToHsl(r, g, b) : [0, 0, 0]
  const [hv, sv, v] = rgb ? rgbToHsv(r, g, b) : [0, 0, 0]
  const contrastWhite = rgb ? contrastRatio(r, g, b, 255, 255, 255) : null
  const contrastBlack = rgb ? contrastRatio(r, g, b, 0, 0, 0) : null
  const palette = rgb ? generatePalette(r, g, b) : null

  const textColor = rgb && relativeLuminance(r, g, b) > 0.179 ? '#000' : '#fff'

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const formats = rgb ? [
    { label: 'HEX',  value: hex!,                     key: 'hex' },
    { label: 'RGB',  value: `rgb(${r}, ${g}, ${b})`,  key: 'rgb' },
    { label: 'HSL',  value: `hsl(${h}, ${sl}%, ${l}%)`, key: 'hsl' },
    { label: 'HSV',  value: `hsv(${hv}, ${sv}%, ${v}%)`, key: 'hsv' },
    { label: 'CSS',  value: `color: ${hex};`,          key: 'css' },
  ] : []

  return (
    <ToolLayout
      title="Color Converter"
      description="Convert colors between HEX, RGB, HSL, HSV. View contrast ratios, accessibility, and generate palettes."
      icon={Pipette}
      iconColor="from-fuchsia-500 to-pink-600"
    >
      <div className="space-y-6">
        {/* Input row */}
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Color (HEX, RGB, HSL, or name)</label>
            <input
              type="text"
              className={`input font-mono ${!rgb && input ? 'border-red-400' : ''}`}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="#5b6cf2 or rgb(91, 108, 242) or blue"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="label">Color Picker</label>
            <input
              type="color"
              value={hex ?? '#000000'}
              onChange={e => setInput(e.target.value)}
              className="h-10 w-16 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-600 p-0.5 bg-white dark:bg-slate-800"
            />
          </div>
          <button className="btn-secondary h-10" onClick={() => setInput(randomColor())}>
            <Shuffle size={16} /> Random
          </button>
        </div>

        {rgb && hex ? (
          <>
            {/* Big color swatch */}
            <div
              className="h-24 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300"
              style={{ background: hex }}
            >
              <span className="font-mono font-bold text-xl" style={{ color: textColor }}>{hex.toUpperCase()}</span>
            </div>

            {/* Formats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {formats.map(f => (
                <div key={f.key} className="card p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-400">{f.label}</p>
                    <code className="text-sm font-mono font-semibold">{f.value}</code>
                  </div>
                  <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => copy(f.value, f.key)}>
                    {copied === f.key ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />}
                  </button>
                </div>
              ))}

              {/* Individual channel sliders */}
              <div className="card p-3 space-y-2 col-span-full sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-semibold text-slate-400">RGB Channels</p>
                {[
                  { label: 'R', value: r, color: 'bg-red-500', gradient: 'from-black to-red-600' },
                  { label: 'G', value: g, color: 'bg-green-500', gradient: 'from-black to-green-600' },
                  { label: 'B', value: b, color: 'bg-blue-500', gradient: 'from-black to-blue-600' },
                ].map(ch => (
                  <div key={ch.label} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-3 text-slate-500">{ch.label}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: `linear-gradient(to right, #000, ${ch.label === 'R' ? 'red' : ch.label === 'G' ? 'lime' : 'blue'})` }}>
                      <div className="h-full" style={{ width: `${(ch.value / 255) * 100}%`, background: 'transparent', boxShadow: '2px 0 0 2px rgba(255,255,255,0.8)' }} />
                    </div>
                    <span className="text-xs font-mono w-8 text-right">{ch.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Accessibility */}
              <div className="card p-4 space-y-3">
                <h3 className="font-semibold text-sm">Accessibility (WCAG 2.1)</h3>
                {[
                  { bg: 'white', ratio: contrastWhite! },
                  { bg: 'black', ratio: contrastBlack! },
                ].map(({ bg, ratio }) => (
                  <div key={bg} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">vs {bg}</span>
                      <span className="font-mono font-bold">{ratio.toFixed(2)}:1</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      {[
                        { level: 'AA Normal', min: 4.5 },
                        { level: 'AA Large', min: 3 },
                        { level: 'AAA Normal', min: 7 },
                        { level: 'AAA Large', min: 4.5 },
                      ].map(({ level, min }) => (
                        <span key={level} className={`px-1.5 py-0.5 rounded text-xs font-medium ${ratio >= min ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                          {level}: {ratio >= min ? '✓' : '✗'}
                        </span>
                      ))}
                    </div>
                    <div
                      className="rounded-lg p-2 text-sm font-medium text-center"
                      style={{ background: bg === 'white' ? '#fff' : '#000', color: hex }}
                    >
                      Sample text on {bg}
                    </div>
                  </div>
                ))}
              </div>

              {/* Harmony palette */}
              {palette && (
                <div className="card p-4 space-y-3">
                  <h3 className="font-semibold text-sm">Color Harmony</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Complement', colors: [palette.complement] },
                      { label: 'Triadic', colors: palette.triadic },
                      { label: 'Analogous', colors: palette.analogous },
                    ].map(({ label, colors }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-20 shrink-0">{label}</span>
                        <div className="flex gap-1.5">
                          {colors.map(c => (
                            <button
                              key={c}
                              className="group relative"
                              onClick={() => setInput(c)}
                              title={c}
                            >
                              <div className="w-8 h-8 rounded-lg shadow-sm border border-white/20 transition-transform group-hover:scale-110" style={{ background: c }} />
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {colors.map(c => (
                            <code key={c} className="text-xs text-slate-400">{c}</code>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tints & Shades */}
            {palette && (
              <div className="card p-4 space-y-3">
                <h3 className="font-semibold text-sm">Tints & Shades</h3>
                <div className="flex gap-1 h-12 rounded-xl overflow-hidden">
                  {palette.tints.map(t => (
                    <button
                      key={t.label}
                      className="flex-1 transition-transform hover:scale-y-110 group relative"
                      style={{ background: t.hex }}
                      onClick={() => setInput(t.hex)}
                      title={`${t.hex} (lightness ${t.label})`}
                    >
                      <span className="absolute bottom-0.5 left-0 right-0 text-center text-xs opacity-0 group-hover:opacity-100 font-mono" style={{ color: relativeLuminance(...(hexToRgb(t.hex) ?? [0,0,0])) > 0.179 ? '#000' : '#fff' }}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {palette.tints.map(t => (
                    <button
                      key={t.label}
                      className="flex items-center gap-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                      onClick={() => copy(t.hex, `tint-${t.label}`)}
                    >
                      <div className="w-3 h-3 rounded" style={{ background: t.hex }} />
                      <code>{t.hex}</code>
                      {copied === `tint-${t.label}` && <Check size={10} className="text-green-500" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : input ? (
          <div className="text-sm text-red-500">✗ Could not parse color. Try formats like: #ff0000, rgb(255,0,0), hsl(0,100%,50%), or named colors like "red".</div>
        ) : null}

        {/* Common color swatches */}
        <div className="card p-4 space-y-3">
          <h3 className="font-semibold text-sm">Color Palette</h3>
          <div className="flex flex-wrap gap-2">
            {['#ef4444','#f97316','#f59e0b','#84cc16','#22c55e','#14b8a6','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#ec4899','#f43f5e','#64748b','#1e293b','#ffffff','#000000'].map(c => (
              <button
                key={c}
                className="w-8 h-8 rounded-lg shadow-sm border-2 transition-transform hover:scale-110"
                style={{ background: c, borderColor: input.toLowerCase() === c.toLowerCase() ? '#5b6cf2' : 'transparent' }}
                onClick={() => setInput(c)}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
