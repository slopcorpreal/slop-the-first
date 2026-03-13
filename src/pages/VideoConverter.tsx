import { useState, useRef, useCallback, useEffect } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { Video, Upload, Download, X, Loader2, AlertCircle, Settings2 } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

const OUTPUT_FORMATS = [
  { value: 'mp4', label: 'MP4 (H.264)', ext: 'mp4', args: ['-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac'] },
  { value: 'webm', label: 'WebM (VP8)', ext: 'webm', args: ['-c:v', 'libvpx', '-crf', '10', '-b:v', '1M', '-c:a', 'libvorbis'] },
  { value: 'gif', label: 'Animated GIF', ext: 'gif', args: ['-vf', 'fps=12,scale=480:-1:flags=lanczos', '-loop', '0'] },
  { value: 'mp3', label: 'MP3 Audio', ext: 'mp3', args: ['-vn', '-ar', '44100', '-ac', '2', '-ab', '192k'] },
  { value: 'wav', label: 'WAV Audio', ext: 'wav', args: ['-vn', '-ar', '44100', '-ac', '2'] },
]
const MAX_MEDIA_FILE_SIZE = 500 * 1024 * 1024

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

export default function VideoConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState('mp4')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('idle')
  const [log, setLog] = useState('')
  const [outputUrl, setOutputUrl] = useState('')
  const [outputSize, setOutputSize] = useState(0)
  const [duration, setDuration] = useState(0)
  const [drag, setDrag] = useState(false)
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const setInputFile = useCallback((f: File | null) => {
    const clearSelectedState = () => {
      setFile(null)
      setOutputUrl('')
      setOutputSize(0)
      setProgress(0)
      setDuration(0)
    }

    if (!f) {
      clearSelectedState()
      setStatus('idle')
      setLog('')
      return
    }
    if (f.size > MAX_MEDIA_FILE_SIZE) {
      clearSelectedState()
      setStatus('error')
      setLog('File is too large. Please choose a media file up to 500 MB.')
      return
    }
    setFile(f)
    setStatus('idle')
    setLog('')
    setOutputUrl('')
    setOutputSize(0)
  }, [])

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current) return ffmpegRef.current
    const ffmpeg = new FFmpeg()
    ffmpeg.on('log', ({ message }) => setLog(message))
    ffmpeg.on('progress', ({ progress: p, time }) => {
      setProgress(Math.round(p * 100))
      if (time) setDuration(time / 1_000_000)
    })
    const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
    })
    ffmpegRef.current = ffmpeg
    return ffmpeg
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.type.startsWith('video/') || f.type.startsWith('audio/'))) setInputFile(f)
  }

  const convert = async () => {
    if (!file) return
    setStatus('loading')
    setProgress(0)
    setLog('')
    try {
      const ffmpeg = await loadFFmpeg()
      setStatus('processing')
      const fmt = OUTPUT_FORMATS.find(f => f.value === format)!
      const inputName = `input.${file.name.split('.').pop() || 'mp4'}`
      const outputName = `output.${fmt.ext}`
      await ffmpeg.writeFile(inputName, await fetchFile(file))
      await ffmpeg.exec(['-i', inputName, ...fmt.args, outputName])
      const data = await ffmpeg.readFile(outputName)
      // data can be Uint8Array or string; coerce to ArrayBuffer for Blob
      const buffer = data instanceof Uint8Array ? data.buffer as ArrayBuffer : new TextEncoder().encode(data as string).buffer as ArrayBuffer
      const blob = new Blob([buffer], { type: `video/${fmt.ext}` })
      setOutputUrl(URL.createObjectURL(blob))
      setOutputSize(blob.size)
      setStatus('done')
    } catch (e) {
      console.error(e)
      setStatus('error')
      setLog(String(e))
    }
  }

  const reset = () => {
    setFile(null)
    setStatus('idle')
    setProgress(0)
    setLog('')
    setOutputUrl('')
    setOutputSize(0)
  }

  useEffect(() => {
    return () => {
      if (outputUrl) URL.revokeObjectURL(outputUrl)
    }
  }, [outputUrl])

  const fmt = OUTPUT_FORMATS.find(f => f.value === format)!

  return (
    <ToolLayout
      title="Video Converter"
      description="Convert, compress, and process video files using FFmpeg WebAssembly — 100% in your browser."
      icon={Video}
      iconColor="from-red-500 to-orange-500"
      badge="FFmpeg WASM"
      badgeColor="badge-purple"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          <div
            className={`drop-zone ${drag ? 'drop-zone-active' : ''} ${file ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/*,audio/*"
              className="hidden"
              onChange={e => setInputFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div>
                <Video size={32} className="mx-auto mb-2 text-green-500" />
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-slate-400 mt-1">{formatBytes(file.size)}</p>
              </div>
            ) : (
              <div>
                <Upload size={32} className="mx-auto mb-2 text-slate-400" />
                <p className="font-medium text-sm">Drop video / audio here</p>
                <p className="text-xs text-slate-400 mt-1">MP4, MKV, MOV, AVI, WebM, MP3, WAV…</p>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2 font-medium text-sm">
              <Settings2 size={16} />
              Output Settings
            </div>
            <div>
              <label className="label">Output Format</label>
              <select
                className="input"
                value={format}
                onChange={e => setFormat(e.target.value)}
              >
                {OUTPUT_FORMATS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="btn-primary flex-1 justify-center"
              disabled={!file || status === 'loading' || status === 'processing'}
              onClick={convert}
            >
              {(status === 'loading' || status === 'processing') ? (
                <><Loader2 size={16} className="animate-spin" /> Processing…</>
              ) : (
                <><Video size={16} /> Convert</>
              )}
            </button>
            {file && (
              <button className="btn-secondary" onClick={reset}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Privacy note */}
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            🔒 Processed entirely in your browser. Nothing is uploaded.
          </p>
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          {/* Progress */}
          {file && (
            <div className="min-h-28">
              {(status === 'loading' || status === 'processing') && (
                <div className="card p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-brand-500" />
                      {status === 'loading' ? 'Loading FFmpeg…' : 'Converting…'}
                    </span>
                    <span className="text-slate-500">{progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {duration > 0 && (
                    <p className="text-xs text-slate-400">Time: {formatTime(duration)}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="card p-4 border-red-200 dark:border-red-800 animate-fade-in">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium mb-2">
                <AlertCircle size={16} />
                Conversion failed
              </div>
              <p className="text-xs text-slate-500 font-mono">{log}</p>
            </div>
          )}

          {/* Output */}
          {status === 'done' && outputUrl && (
            <div className="card p-4 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-green-600 dark:text-green-400">✓ Conversion complete</span>
                <span className="text-xs text-slate-400">{formatBytes(outputSize)}</span>
              </div>
              {['mp4', 'webm'].includes(format) && (
                <video controls className="w-full rounded-lg bg-slate-950 aspect-video" src={outputUrl} />
              )}
              {['mp3', 'wav'].includes(format) && (
                <audio controls className="w-full" src={outputUrl} />
              )}
              {format === 'gif' && (
                <img src={outputUrl} alt="output gif" className="w-full rounded-lg bg-slate-950 aspect-video object-contain" />
              )}
              <a
                href={outputUrl}
                download={`output.${fmt.ext}`}
                className="btn-primary w-full justify-center"
              >
                <Download size={16} /> Download {fmt.label}
              </a>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Input: {formatBytes(file?.size || 0)}</span>
                <span>Output: {formatBytes(outputSize)}</span>
                <span>Ratio: {((outputSize / (file?.size || 1)) * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}

          {/* Log */}
          {log && status !== 'error' && (
            <details className="card overflow-hidden">
              <summary className="p-3 cursor-pointer text-sm font-medium text-slate-500">FFmpeg Log</summary>
              <div className="p-3 pt-0">
                <pre className="text-xs font-mono text-slate-400 whitespace-pre-wrap max-h-40 overflow-auto">
                  {log}
                </pre>
              </div>
            </details>
          )}

          {status === 'idle' && !file && (
            <div className="card p-8 text-center text-slate-400 border-dashed">
              <Video size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Upload a video to get started</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
