import { useState, useRef, useCallback } from 'react'
import { ImageOff, Upload, Download, X, Loader2, AlertCircle } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'


export default function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [outputUrl, setOutputUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [showBg, setShowBg] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setOutputUrl('')
    setStatus('idle')
    setError('')
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith('image/')) handleFile(f)
  }

  const process = async () => {
    if (!file) return
    setStatus('processing')
    setProgress(0)
    setError('')
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          if (key === 'compute:inference') {
            setProgress(Math.round((current / total) * 100))
          }
        },
      })
      setOutputUrl(URL.createObjectURL(blob))
      setStatus('done')
    } catch (e) {
      setStatus('error')
      setError(String(e))
    }
  }

  const reset = () => {
    setFile(null)
    setPreviewUrl('')
    setOutputUrl('')
    setStatus('idle')
    setError('')
    setProgress(0)
  }

  return (
    <ToolLayout
      title="Background Remover"
      description="Remove image backgrounds instantly with AI-powered ONNX inference — runs entirely in your browser."
      icon={ImageOff}
      iconColor="from-purple-500 to-pink-500"
      badge="AI WASM"
      badgeColor="badge-purple"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
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
            {previewUrl ? (
              <img src={previewUrl} alt="input" className="max-h-48 mx-auto rounded-lg object-contain" />
            ) : (
              <div>
                <Upload size={32} className="mx-auto mb-2 text-slate-400" />
                <p className="font-medium text-sm">Drop an image here</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPEG, WebP, AVIF…</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              className="btn-primary flex-1 justify-center"
              disabled={!file || status === 'processing'}
              onClick={process}
            >
              {status === 'processing' ? (
                <><Loader2 size={16} className="animate-spin" /> Processing…</>
              ) : (
                <><ImageOff size={16} /> Remove Background</>
              )}
            </button>
            {file && (
              <button className="btn-secondary" onClick={reset}>
                <X size={16} />
              </button>
            )}
          </div>

          {status === 'processing' && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Running AI inference…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(progress, 5)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 text-center">
                First run downloads ~40MB AI model (cached afterward)
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="card p-4 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium mb-1">
                <AlertCircle size={16} /> Error
              </div>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center">
            🔒 100% private — AI runs locally in your browser
          </p>
        </div>

        {/* Output */}
        <div className="space-y-4">
          {status === 'done' && outputUrl ? (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-green-600 dark:text-green-400">✓ Background removed</span>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Background:</label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer"
                  />
                  <button
                    onClick={() => setShowBg(!showBg)}
                    className={`text-xs px-2 py-1 rounded ${showBg ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700' : 'bg-slate-100 dark:bg-slate-700'}`}
                  >
                    {showBg ? 'Remove BG' : 'Add BG'}
                  </button>
                </div>
              </div>
              <div
                className="rounded-xl overflow-hidden flex items-center justify-center min-h-48 border border-slate-200 dark:border-slate-700"
                style={{
                  background: showBg ? bgColor : 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 0 0 / 16px 16px',
                }}
              >
                <img src={outputUrl} alt="output" className="max-h-64 max-w-full object-contain" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <a
                href={outputUrl}
                download="background-removed.png"
                className="btn-primary w-full justify-center"
              >
                <Download size={16} /> Download PNG
              </a>
            </div>
          ) : (
            <div className="card p-8 text-center text-slate-400 border-dashed h-full flex flex-col items-center justify-center min-h-48">
              <ImageOff size={48} className="mb-3 opacity-20" />
              <p className="text-sm">Output will appear here</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
