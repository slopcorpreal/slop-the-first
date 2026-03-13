import { useState, useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import { QrCode, Download, Copy, Check } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

const PRESETS = [
  { label: 'URL', value: 'https://example.com', placeholder: 'https://...' },
  { label: 'WiFi', value: 'WIFI:T:WPA;S:NetworkName;P:Password;;', placeholder: 'WIFI:T:WPA;S:SSID;P:Password;;' },
  { label: 'Email', value: 'mailto:hello@example.com', placeholder: 'mailto:...' },
  { label: 'Phone', value: 'tel:+1234567890', placeholder: 'tel:...' },
  { label: 'SMS', value: 'sms:+1234567890?body=Hello', placeholder: 'sms:...' },
  { label: 'vCard', value: 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEMAIL:john@example.com\nEND:VCARD', placeholder: 'vCard text' },
]

export default function QRGenerator() {
  const [text, setText] = useState('https://slopcorpreal.github.io/slop-the-first/')
  const [size, setSize] = useState(300)
  const [margin, setMargin] = useState(4)
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [dataUrl, setDataUrl] = useState('')
  const [svgStr, setSvgStr] = useState('')
  const [copied, setCopied] = useState(false)
  const [preset, setPreset] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!text) return
    const opts: QRCode.QRCodeRenderersOptions = {
      width: size,
      margin,
      color: { dark: fgColor, light: bgColor },
      errorCorrectionLevel: errorLevel,
    }
    QRCode.toDataURL(text, opts).then(setDataUrl).catch(() => {})
    QRCode.toString(text, { ...opts, type: 'svg' }).then(setSvgStr).catch(() => {})
  }, [text, size, margin, fgColor, bgColor, errorLevel])

  const copyText = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadSVG = () => {
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'qrcode.svg'; a.click()
  }

  return (
    <ToolLayout
      title="QR Code Generator"
      description="Generate QR codes for URLs, WiFi, contacts, and more. Download as PNG or SVG."
      icon={QrCode}
      iconColor="from-gray-700 to-gray-900"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings */}
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <div>
              <label className="label">Quick Presets</label>
              <div className="flex flex-wrap gap-1">
                {PRESETS.map((p, i) => (
                  <button
                    key={p.label}
                    onClick={() => { setPreset(i); setText(p.value) }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${preset === i ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 dark:border-slate-600 hover:border-brand-400'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Content</label>
              <textarea
                className="textarea min-h-[100px]"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={PRESETS[preset]?.placeholder}
              />
              <p className="text-xs text-slate-400 mt-1">{text.length} characters</p>
            </div>
          </div>

          <div className="card p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Size (px): {size}</label>
                <input type="range" min={100} max={600} value={size} onChange={e => setSize(+e.target.value)} className="w-full accent-brand-600" />
              </div>
              <div>
                <label className="label">Margin: {margin}</label>
                <input type="range" min={0} max={10} value={margin} onChange={e => setMargin(+e.target.value)} className="w-full accent-brand-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Foreground</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="h-9 w-12 rounded cursor-pointer" />
                  <input type="text" value={fgColor} onChange={e => setFgColor(e.target.value)} className="input flex-1" />
                </div>
              </div>
              <div>
                <label className="label">Background</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-9 w-12 rounded cursor-pointer" />
                  <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="input flex-1" />
                </div>
              </div>
            </div>
            <div>
              <label className="label">Error Correction Level</label>
              <div className="flex gap-2">
                {(['L', 'M', 'Q', 'H'] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setErrorLevel(l)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg border transition-colors ${errorLevel === l ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 dark:border-slate-600 hover:border-brand-400'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">L: 7% · M: 15% · Q: 25% · H: 30% recovery capacity</p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="card p-6 flex items-center justify-center min-h-64">
            {dataUrl ? (
              <img src={dataUrl} alt="QR Code" className="max-w-full" style={{ imageRendering: 'pixelated' }} />
            ) : (
              <div className="text-center text-slate-400">
                <QrCode size={64} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Enter text to generate QR code</p>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {dataUrl && (
            <div className="flex gap-2">
              <a href={dataUrl} download="qrcode.png" className="btn-primary flex-1 justify-center">
                <Download size={16} /> PNG
              </a>
              <button onClick={downloadSVG} className="btn-secondary flex-1 justify-center">
                <Download size={16} /> SVG
              </button>
              <button onClick={copyText} className="btn-secondary">
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
          )}

          <div className="card p-3">
            <p className="text-xs font-medium text-slate-500 mb-2">WIFI Quick Generator</p>
            <div className="grid grid-cols-2 gap-2">
              <input className="input text-xs" placeholder="Network name (SSID)" id="ssid" />
              <input className="input text-xs" placeholder="Password" id="wifi-pass" type="password" />
            </div>
            <button
              className="btn-secondary w-full mt-2 justify-center text-xs"
              onClick={() => {
                const ssid = (document.getElementById('ssid') as HTMLInputElement).value
                const pass = (document.getElementById('wifi-pass') as HTMLInputElement).value
                setText(`WIFI:T:WPA;S:${ssid};P:${pass};;`)
              }}
            >
              Generate WiFi QR
            </button>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
