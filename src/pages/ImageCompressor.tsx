import { useState, useRef, useCallback, useEffect } from 'react'
import { FileImage, Upload, Download, X } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

interface Result {
  url: string
  size: number
  width: number
  height: number
  format: string
}

const MAX_IMAGE_FILE_SIZE = 50 * 1024 * 1024

export default function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [quality, setQuality] = useState(80)
  const [maxWidth, setMaxWidth] = useState(0)
  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('webp')
  const [drag, setDrag] = useState(false)
  const [origDims, setOrigDims] = useState({ w: 0, h: 0 })
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFile = useCallback((f: File) => {
    if (f.size > MAX_IMAGE_FILE_SIZE) {
      setFile(null)
      setPreviewUrl('')
      setResult(null)
      setError('File is too large. Please choose an image up to 50 MB.')
      return
    }
    setFile(f)
    setResult(null)
    setError('')
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
    const img = new Image()
    img.onload = () => setOrigDims({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) handleFile(f)
  }

  const compress = useCallback(async () => {
    if (!file || !canvasRef.current) return
    const canvas = canvasRef.current
    const img = new Image()
    img.src = previewUrl
    await new Promise(r => { img.onload = r })
    let w = img.naturalWidth
    let h = img.naturalHeight
    if (maxWidth > 0 && w > maxWidth) {
      h = Math.round(h * maxWidth / w)
      w = maxWidth
    }
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, w, h)
    const mime = `image/${format}`
    const q = format === 'png' ? undefined : quality / 100
    const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), mime, q))
    setResult({ url: URL.createObjectURL(blob), size: blob.size, width: w, height: h, format })
  }, [file, previewUrl, format, quality, maxWidth])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      if (result?.url) URL.revokeObjectURL(result.url)
    }
  }, [previewUrl, result?.url])

  const savings = result && file ? Math.round((1 - result.size / file.size) * 100) : 0

  return (
    <ToolLayout
      title="Image Compressor"
      description="Compress and resize images with real-time quality control. JPEG, PNG, WebP — all in your browser."
      icon={FileImage}
      iconColor="from-blue-500 to-cyan-500"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="space-y-4">
          <div
            className={`drop-zone ${drag ? 'drop-zone-active' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {file ? (
              <div>
                <FileImage size={28} className="mx-auto mb-1 text-blue-500" />
                <p className="text-xs font-medium truncate max-w-full px-2">{file.name}</p>
                <p className="text-xs text-slate-400">{origDims.w}×{origDims.h} · {formatBytes(file.size)}</p>
              </div>
            ) : (
              <div>
                <Upload size={28} className="mx-auto mb-1 text-slate-400" />
                <p className="text-sm font-medium">Drop image here</p>
                <p className="text-xs text-slate-400">PNG, JPEG, WebP…</p>
              </div>
            )}
          </div>

          <div className="card p-4 space-y-4">
            <div>
              <label className="label">Output Format</label>
              <select className="input" value={format} onChange={e => setFormat(e.target.value as 'jpeg' | 'png' | 'webp')}>
                <option value="webp">WebP (best compression)</option>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG (lossless)</option>
              </select>
            </div>

            {format !== 'png' && (
              <div>
                <label className="label">Quality: {quality}%</label>
                <input
                  type="range" min={10} max={100} value={quality}
                  onChange={e => setQuality(+e.target.value)}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                  <span>Smaller</span><span>Better</span>
                </div>
              </div>
            )}

            <div>
              <label className="label">Max Width (px, 0 = keep original)</label>
              <input
                type="number" min={0} max={8000} value={maxWidth}
                onChange={e => setMaxWidth(+e.target.value)}
                className="input"
                placeholder="0"
              />
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-2">
            <button
              className="btn-primary flex-1 justify-center"
              disabled={!file}
              onClick={compress}
            >
              <FileImage size={16} /> Compress
            </button>
            {file && <button className="btn-secondary" onClick={() => { setFile(null); setPreviewUrl(''); setResult(null) }}><X size={16} /></button>}
          </div>
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Before */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Original</span>
            {file && <span className="badge-blue">{formatBytes(file.size)}</span>}
          </div>
          <div className="card overflow-hidden min-h-48 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            {previewUrl
              ? <img src={previewUrl} alt="original" className="max-h-64 max-w-full object-contain p-2" />
              : <span className="text-slate-300 text-sm">No image selected</span>
            }
          </div>
        </div>

        {/* After */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Compressed</span>
            {result && (
              <div className="flex items-center gap-2">
                <span className="badge-blue">{formatBytes(result.size)}</span>
                {savings > 0 && <span className="badge-green">-{savings}%</span>}
                {savings < 0 && <span className="badge-orange">+{Math.abs(savings)}%</span>}
              </div>
            )}
          </div>
          <div className="card overflow-hidden min-h-48 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            {result
              ? <img src={result.url} alt="compressed" className="max-h-64 max-w-full object-contain p-2" />
              : <span className="text-slate-300 text-sm">Result appears here</span>
            }
          </div>
          {result && (
            <a href={result.url} download={`compressed.${result.format}`} className="btn-primary w-full justify-center">
              <Download size={16} /> Download {result.format.toUpperCase()}
            </a>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
