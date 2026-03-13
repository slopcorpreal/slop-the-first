import { useState, useRef, useCallback } from 'react'
import { Palette, Upload, Copy, Check } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

interface ColorInfo {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  count: number
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r: number, g: number, b: number) {
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
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function extractColors(imageData: ImageData, numColors = 10): ColorInfo[] {
  const { data } = imageData
  const colorMap = new Map<string, { r: number; g: number; b: number; count: number }>()
  
  // Sample every 8 pixels for performance
  for (let i = 0; i < data.length; i += 4 * 8) {
    const r = Math.round(data[i] / 32) * 32
    const g = Math.round(data[i + 1] / 32) * 32
    const b = Math.round(data[i + 2] / 32) * 32
    const a = data[i + 3]
    if (a < 128) continue // skip transparent
    const key = `${r},${g},${b}`
    const existing = colorMap.get(key)
    if (existing) existing.count++
    else colorMap.set(key, { r, g, b, count: 1 })
  }

  return Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, numColors)
    .map(c => ({
      hex: rgbToHex(c.r, c.g, c.b),
      rgb: { r: c.r, g: c.g, b: c.b },
      hsl: rgbToHsl(c.r, c.g, c.b),
      count: c.count,
    }))
}

export default function ColorPalette() {
  const [imageUrl, setImageUrl] = useState('')
  const [colors, setColors] = useState<ColorInfo[]>([])
  const [numColors, setNumColors] = useState(10)
  const [copied, setCopied] = useState('')
  const [drag, setDrag] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processImage = useCallback((url: string) => {
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current!
      const MAX = 200
      const scale = Math.min(MAX / img.width, MAX / img.height)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      setColors(extractColors(imgData, numColors))
    }
    img.src = url
  }, [numColors])

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) return
    const url = URL.createObjectURL(f)
    setImageUrl(url)
    processImage(url)
  }

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const exportCSS = () => {
    const css = `:root {\n${colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n')}\n}`
    copy(css, 'css')
  }

  const exportJSON = () => {
    copy(JSON.stringify(colors.map(c => ({ hex: c.hex, rgb: `rgb(${c.rgb.r},${c.rgb.g},${c.rgb.b})`, hsl: `hsl(${c.hsl.h},${c.hsl.s}%,${c.hsl.l}%)` })), null, 2), 'json')
  }


  return (
    <ToolLayout
      title="Color Palette Extractor"
      description="Extract dominant colors from any image and export as CSS variables, HEX, or JSON."
      icon={Palette}
      iconColor="from-pink-500 to-rose-500"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div
            className={`drop-zone ${drag ? 'drop-zone-active' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            {imageUrl ? (
              <img src={imageUrl} alt="input" className="max-h-48 mx-auto rounded-lg object-contain" />
            ) : (
              <div>
                <Upload size={32} className="mx-auto mb-2 text-slate-400" />
                <p className="font-medium text-sm">Drop an image to extract colors</p>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          <div>
            <label className="label">Number of colors: {numColors}</label>
            <input type="range" min={3} max={20} value={numColors} onChange={e => { setNumColors(+e.target.value); if (imageUrl) processImage(imageUrl) }} className="w-full accent-brand-600" />
          </div>

          {colors.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button className="btn-secondary text-sm py-1.5" onClick={exportCSS}>
                {copied === 'css' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />} Copy CSS vars
              </button>
              <button className="btn-secondary text-sm py-1.5" onClick={exportJSON}>
                {copied === 'json' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />} Copy JSON
              </button>
            </div>
          )}
        </div>

        {/* Palette */}
        <div className="space-y-3">
          {colors.length > 0 ? (
            <>
              {/* Swatch strip */}
              <div className="h-16 rounded-xl overflow-hidden flex">
                {colors.map(c => (
                  <div key={c.hex} className="flex-1" style={{ background: c.hex }} />
                ))}
              </div>

              {/* Color list */}
              <div className="space-y-2">
                {colors.map((c, i) => (
                  <div key={c.hex} className="flex items-center gap-3 card p-3">
                    <div
                      className="w-10 h-10 rounded-lg flex-shrink-0 shadow-sm"
                      style={{ background: c.hex }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-medium">{c.hex}</p>
                      <p className="text-xs text-slate-400">
                        rgb({c.rgb.r}, {c.rgb.g}, {c.rgb.b}) · hsl({c.hsl.h}°, {c.hsl.s}%, {c.hsl.l}%)
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xs" onClick={() => copy(c.hex, `hex-${i}`)}>
                        {copied === `hex-${i}` ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="card p-8 text-center text-slate-400 border-dashed min-h-48 flex flex-col items-center justify-center">
              <Palette size={48} className="mb-3 opacity-20" />
              <p className="text-sm">Upload an image to extract colors</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
