import { useState, useMemo, useEffect } from 'react'
import { KeyRound, Copy, Check, AlertCircle, Clock } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

const SAMPLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

function b64decode(s: string): string {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/')
  const padded = pad.padEnd(pad.length + (4 - (pad.length % 4)) % 4, '=')
  try {
    return decodeURIComponent(escape(atob(padded)))
  } catch {
    return atob(padded)
  }
}

function prettyJson(obj: unknown) {
  return JSON.stringify(obj, null, 2)
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unknown error'
}

const ALG_DESCRIPTIONS: Record<string, string> = {
  HS256: 'HMAC + SHA-256 (symmetric)',
  HS384: 'HMAC + SHA-384 (symmetric)',
  HS512: 'HMAC + SHA-512 (symmetric)',
  RS256: 'RSA + SHA-256 (asymmetric)',
  RS384: 'RSA + SHA-384 (asymmetric)',
  RS512: 'RSA + SHA-512 (asymmetric)',
  ES256: 'ECDSA + SHA-256 (asymmetric)',
  ES384: 'ECDSA + SHA-384 (asymmetric)',
  ES512: 'ECDSA + SHA-512 (asymmetric)',
  PS256: 'RSASSA-PSS + SHA-256',
  PS384: 'RSASSA-PSS + SHA-384',
  PS512: 'RSASSA-PSS + SHA-512',
  none: 'No signature (insecure!)',
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' })
}

function timeAgo(ts: number) {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (Math.abs(diff) < 60) return diff > 0 ? `${diff}s ago` : `in ${-diff}s`
  const mins = Math.floor(Math.abs(diff) / 60)
  if (mins < 60) return diff > 0 ? `${mins}m ago` : `in ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return diff > 0 ? `${hrs}h ago` : `in ${hrs}h`
  const days = Math.floor(hrs / 24)
  return diff > 0 ? `${days}d ago` : `in ${days}d`
}

function SyntaxHighlight({ json }: { json: string }) {
  const html = json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      m => {
        let cls = 'text-blue-400'
        if (/^"/.test(m)) cls = /:$/.test(m) ? 'text-red-400' : 'text-green-300'
        else if (/true|false/.test(m)) cls = 'text-yellow-400'
        else if (/null/.test(m)) cls = 'text-slate-400'
        return `<span class="${cls}">${m}</span>`
      }
    )
  return <div className="whitespace-pre text-xs font-mono leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
}

export default function JWTDebugger() {
  const [token, setToken] = useState(SAMPLE)
  const [copied, setCopied] = useState<string | null>(null)
  const [now, setNow] = useState(() => Math.floor(new Date().getTime() / 1000))

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Math.floor(new Date().getTime() / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const parsed = useMemo(() => {
    const parts = token.trim().split('.')
    if (parts.length !== 3) return { error: 'JWT must have exactly 3 parts separated by dots' }
    try {
      const header = JSON.parse(b64decode(parts[0]))
      const payload = JSON.parse(b64decode(parts[1]))
      const sig = parts[2]
      return { header, payload, sig, error: null }
    } catch (error: unknown) {
      return { error: `Parse error: ${getErrorMessage(error)}` }
    }
  }, [token])

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const expStatus = useMemo(() => {
    if (!parsed.payload || parsed.error) return null
    const p = parsed.payload as Record<string, unknown>
    if (typeof p.exp !== 'number') return null
    const expired = p.exp < now
    const diff = Math.abs((p.exp as number) - now)
    const d = Math.floor(diff / 86400)
    const h = Math.floor((diff % 86400) / 3600)
    const m = Math.floor((diff % 3600) / 60)
    const label = `${d > 0 ? `${d}d ` : ''}${h > 0 ? `${h}h ` : ''}${m}m`
    return { expired, label }
  }, [parsed, now])

  const parts = token.trim().split('.')

  return (
    <ToolLayout
      title="JWT Debugger"
      description="Decode and inspect JSON Web Tokens. View header, payload, claims, and expiry — 100% client-side."
      icon={KeyRound}
      iconColor="from-amber-500 to-orange-500"
      badge="Client-side"
      badgeColor="badge-orange"
    >
      <div className="space-y-5">
        {/* Encoded token input */}
        <div>
          <label className="label">Encoded Token</label>
          <div className="relative">
            <textarea
              className="textarea min-h-[100px] font-mono text-xs pr-10"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Paste your JWT here…"
              spellCheck={false}
            />
            <button
              className="absolute top-2 right-2 p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              onClick={() => copy(token, 'token')}
            >
              {copied === 'token' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />}
            </button>
          </div>
          {/* Coloured token parts */}
          {parts.length === 3 && (
            <div className="mt-2 font-mono text-xs break-all leading-relaxed">
              <span className="text-red-400">{parts[0]}</span>
              <span className="text-slate-400">.</span>
              <span className="text-purple-400">{parts[1]}</span>
              <span className="text-slate-400">.</span>
              <span className="text-cyan-400">{parts[2]}</span>
            </div>
          )}
        </div>

        {parsed.error ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={16} /> {parsed.error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-red-500 dark:text-red-400">Header</h3>
                <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => copy(JSON.stringify(parsed.header, null, 2), 'header')}>
                  {copied === 'header' ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-slate-400" />}
                </button>
              </div>
              <div className="code-block min-h-[140px]">
                <SyntaxHighlight json={prettyJson(parsed.header)} />
              </div>
              {parsed.header && (
                <div className="card p-3 space-y-1.5 text-xs">
                  {parsed.header.alg && (
                    <div>
                      <span className="text-slate-400">Algorithm: </span>
                      <span className="font-semibold">{parsed.header.alg}</span>
                      <span className="text-slate-400 ml-1">({ALG_DESCRIPTIONS[parsed.header.alg] || 'custom'})</span>
                    </div>
                  )}
                  {parsed.header.typ && (
                    <div>
                      <span className="text-slate-400">Type: </span>
                      <span className="font-semibold">{parsed.header.typ}</span>
                    </div>
                  )}
                  {parsed.header.kid && (
                    <div>
                      <span className="text-slate-400">Key ID: </span>
                      <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{parsed.header.kid}</code>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-purple-500 dark:text-purple-400">Payload</h3>
                <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => copy(JSON.stringify(parsed.payload, null, 2), 'payload')}>
                  {copied === 'payload' ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-slate-400" />}
                </button>
              </div>
              <div className="code-block min-h-[140px]">
                <SyntaxHighlight json={prettyJson(parsed.payload)} />
              </div>
              {/* Standard claims */}
              {parsed.payload && (() => {
                const p = parsed.payload as Record<string, unknown>
                const claims = []
                if (typeof p.iat === 'number') claims.push({ k: 'Issued At', v: formatDate(p.iat), sub: timeAgo(p.iat) })
                if (typeof p.exp === 'number') claims.push({ k: 'Expires', v: formatDate(p.exp), sub: timeAgo(p.exp), exp: p.exp < now })
                if (typeof p.nbf === 'number') claims.push({ k: 'Not Before', v: formatDate(p.nbf), sub: timeAgo(p.nbf) })
                if (!claims.length) return null
                return (
                  <div className="card p-3 space-y-1.5 text-xs">
                    {claims.map(c => (
                      <div key={c.k} className="flex items-start justify-between gap-2">
                        <span className="text-slate-400 shrink-0">{c.k}:</span>
                        <div className="text-right">
                          <div className={`font-medium ${'exp' in c && c.exp ? 'text-red-500' : ''}`}>{c.v}</div>
                          <div className={`${'exp' in c && c.exp ? 'text-red-400' : 'text-slate-400'}`}>{c.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Signature */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-cyan-500 dark:text-cyan-400">Signature</h3>
              <div className="code-block min-h-[140px]">
                <div className="text-xs font-mono text-cyan-400 break-all">{parsed.sig}</div>
              </div>
              <div className="card p-3 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle size={14} />
                  <span className="font-medium">Cannot verify signature in browser</span>
                </div>
                <p className="text-slate-400">
                  Signature verification requires the secret key (HMAC) or public key (RSA/ECDSA).
                  Never paste real tokens with sensitive data into online tools.
                </p>
              </div>

              {/* Expiry status */}
              {expStatus && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  expStatus.expired
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                }`}>
                  <Clock size={14} />
                  {expStatus.expired ? `Expired ${expStatus.label} ago` : `Expires in ${expStatus.label}`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Samples */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Samples:</span>
          <button className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors" onClick={() => setToken(SAMPLE)}>
            HS256 sample
          </button>
          <button
            className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
            onClick={() => setToken('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0xIn0.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDg2NDAwLCJpc3MiOiJodHRwczovL2F1dGguZXhhbXBsZS5jb20iLCJhdWQiOiJhcGkuZXhhbXBsZS5jb20ifQ.signature')}
          >
            RS256 sample
          </button>
        </div>
      </div>
    </ToolLayout>
  )
}
