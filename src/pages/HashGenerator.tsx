import { useState, useEffect, useRef } from 'react'
import { Hash, Copy, Check, Upload } from 'lucide-react'
import ToolLayout from '../components/ToolLayout'

const ALGOS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const

async function hashText(text: string, algo: string): Promise<string> {
  const buf = new TextEncoder().encode(text)
  const hashBuf = await crypto.subtle.digest(algo, buf)
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hashBuffer(buf: ArrayBuffer, algo: string): Promise<string> {
  const hashBuf = await crypto.subtle.digest(algo, buf)
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Simple MD5 implementation (not Web Crypto)
function md5(input: string): string {
  function safeAdd(x: number, y: number) { const lsw = (x & 0xffff) + (y & 0xffff); const msw = (x >> 16) + (y >> 16) + (lsw >> 16); return (msw << 16) | (lsw & 0xffff) }
  function bitRotateLeft(num: number, cnt: number) { return (num << cnt) | (num >>> (32 - cnt)) }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b) }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn((b & c) | (~b & d), a, b, x, s, t) }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn((b & d) | (c & ~d), a, b, x, s, t) }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(b ^ c ^ d, a, b, x, s, t) }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) { return md5cmn(c ^ (b | ~d), a, b, x, s, t) }

  // Encode the string as UTF-8 bytes
  function encodeUtf8(str: string): number[] {
    const out: number[] = []
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i)
      if (c < 128) {
        out.push(c)
      } else if (c < 2048) {
        out.push((c >> 6) | 192)
        out.push((c & 63) | 128)
      } else {
        out.push((c >> 12) | 224)
        out.push(((c >> 6) & 63) | 128)
        out.push((c & 63) | 128)
      }
    }
    return out
  }

  const bytes: number[] = encodeUtf8(input)
  const len8 = bytes.length
  bytes.push(128)
  while (bytes.length % 64 !== 56) bytes.push(0)
  const bitLen = len8 * 8
  bytes.push(bitLen & 0xff, (bitLen >> 8) & 0xff, (bitLen >> 16) & 0xff, (bitLen >> 24) & 0xff, 0, 0, 0, 0)

  const M: number[] = []
  for (let i = 0; i < bytes.length; i += 4) M.push(bytes[i] | (bytes[i+1] << 8) | (bytes[i+2] << 16) | (bytes[i+3] << 24))

  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476

  for (let i = 0; i < M.length; i += 16) {
    const [aa, bb, cc, dd] = [a, b, c, d]
    a = md5ff(a,b,c,d,M[i+0],7,-680876936); d = md5ff(d,a,b,c,M[i+1],12,-389564586); c = md5ff(c,d,a,b,M[i+2],17,606105819); b = md5ff(b,c,d,a,M[i+3],22,-1044525330)
    a = md5ff(a,b,c,d,M[i+4],7,-176418897); d = md5ff(d,a,b,c,M[i+5],12,1200080426); c = md5ff(c,d,a,b,M[i+6],17,-1473231341); b = md5ff(b,c,d,a,M[i+7],22,-45705983)
    a = md5ff(a,b,c,d,M[i+8],7,1770035416); d = md5ff(d,a,b,c,M[i+9],12,-1958414417); c = md5ff(c,d,a,b,M[i+10],17,-42063); b = md5ff(b,c,d,a,M[i+11],22,-1990404162)
    a = md5ff(a,b,c,d,M[i+12],7,1804603682); d = md5ff(d,a,b,c,M[i+13],12,-40341101); c = md5ff(c,d,a,b,M[i+14],17,-1502002290); b = md5ff(b,c,d,a,M[i+15],22,1236535329)
    a = md5gg(a,b,c,d,M[i+1],5,-165796510); d = md5gg(d,a,b,c,M[i+6],9,-1069501632); c = md5gg(c,d,a,b,M[i+11],14,643717713); b = md5gg(b,c,d,a,M[i+0],20,-373897302)
    a = md5gg(a,b,c,d,M[i+5],5,-701558691); d = md5gg(d,a,b,c,M[i+10],9,38016083); c = md5gg(c,d,a,b,M[i+15],14,-660478335); b = md5gg(b,c,d,a,M[i+4],20,-405537848)
    a = md5gg(a,b,c,d,M[i+9],5,568446438); d = md5gg(d,a,b,c,M[i+14],9,-1019803690); c = md5gg(c,d,a,b,M[i+3],14,-187363961); b = md5gg(b,c,d,a,M[i+8],20,1163531501)
    a = md5gg(a,b,c,d,M[i+13],5,-1444681467); d = md5gg(d,a,b,c,M[i+2],9,-51403784); c = md5gg(c,d,a,b,M[i+7],14,1735328473); b = md5gg(b,c,d,a,M[i+12],20,-1926607734)
    a = md5hh(a,b,c,d,M[i+5],4,-378558); d = md5hh(d,a,b,c,M[i+8],11,-2022574463); c = md5hh(c,d,a,b,M[i+11],16,1839030562); b = md5hh(b,c,d,a,M[i+14],23,-35309556)
    a = md5hh(a,b,c,d,M[i+1],4,-1530992060); d = md5hh(d,a,b,c,M[i+4],11,1272893353); c = md5hh(c,d,a,b,M[i+7],16,-155497632); b = md5hh(b,c,d,a,M[i+10],23,-1094730640)
    a = md5hh(a,b,c,d,M[i+13],4,681279174); d = md5hh(d,a,b,c,M[i+0],11,-358537222); c = md5hh(c,d,a,b,M[i+3],16,-722521979); b = md5hh(b,c,d,a,M[i+6],23,76029189)
    a = md5hh(a,b,c,d,M[i+9],4,-640364487); d = md5hh(d,a,b,c,M[i+12],11,-421815835); c = md5hh(c,d,a,b,M[i+15],16,530742520); b = md5hh(b,c,d,a,M[i+2],23,-995338651)
    a = md5ii(a,b,c,d,M[i+0],6,-198630844); d = md5ii(d,a,b,c,M[i+7],10,1126891415); c = md5ii(c,d,a,b,M[i+14],15,-1416354905); b = md5ii(b,c,d,a,M[i+5],21,-57434055)
    a = md5ii(a,b,c,d,M[i+12],6,1700485571); d = md5ii(d,a,b,c,M[i+3],10,-1894986606); c = md5ii(c,d,a,b,M[i+10],15,-1051523); b = md5ii(b,c,d,a,M[i+1],21,-2054922799)
    a = md5ii(a,b,c,d,M[i+8],6,1873313359); d = md5ii(d,a,b,c,M[i+15],10,-30611744); c = md5ii(c,d,a,b,M[i+6],15,-1560198380); b = md5ii(b,c,d,a,M[i+13],21,1309151649)
    a = md5ii(a,b,c,d,M[i+4],6,-145523070); d = md5ii(d,a,b,c,M[i+11],10,-1120210379); c = md5ii(c,d,a,b,M[i+2],15,718787259); b = md5ii(b,c,d,a,M[i+9],21,-343485551)
    a = safeAdd(a, aa); b = safeAdd(b, bb); c = safeAdd(c, cc); d = safeAdd(d, dd)
  }

  return [a,b,c,d].map(n => {
    const hex = (((n & 0xff) << 24) | ((n & 0xff00) << 8) | ((n >> 8) & 0xff00) | ((n >> 24) & 0xff)) >>> 0
    return hex.toString(16).padStart(8, '0')
  }).join('')
}

export default function HashGenerator() {
  const [text, setText] = useState('Hello, World!')
  const [hashes, setHashes] = useState<Record<string, string>>({})
  const [fileHashes, setFileHashes] = useState<Record<string, string>>({})
  const [fileName, setFileName] = useState('')
  const [copied, setCopied] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const compute = async () => {
      const results: Record<string, string> = { 'MD5': md5(text) }
      for (const algo of ALGOS) {
        try { results[algo] = await hashText(text, algo) } catch { results[algo] = 'Error' }
      }
      setHashes(results)
    }
    compute()
  }, [text])

  const handleFile = async (f: File) => {
    setFileName(f.name)
    const buf = await f.arrayBuffer()
    const results: Record<string, string> = {}
    for (const algo of ALGOS) {
      try { results[algo] = await hashBuffer(buf, algo) } catch { results[algo] = 'Error' }
    }
    setFileHashes(results)
  }

  const copy = async (val: string, key: string) => {
    await navigator.clipboard.writeText(val)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const HashRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <span className="w-20 text-xs font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">{label}</span>
      <code className="flex-1 text-xs font-mono break-all text-slate-700 dark:text-slate-300">{value}</code>
      <button
        className="flex-shrink-0 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
        onClick={() => copy(value, label)}
      >
        {copied === label ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-slate-400" />}
      </button>
    </div>
  )

  return (
    <ToolLayout
      title="Hash Generator"
      description="Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512 hashes from text or files using the Web Crypto API."
      icon={Hash}
      iconColor="from-indigo-500 to-violet-500"
    >
      <div className="space-y-6">
        {/* Text hashing */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold">Hash from Text</h2>
          <textarea
            className="textarea min-h-[100px]"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Enter text to hash…"
          />
          <div className="space-y-2">
            {Object.entries(hashes).map(([k, v]) => <HashRow key={k} label={k} value={v} />)}
          </div>
        </div>

        {/* File hashing */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold">Hash from File</h2>
          <input ref={fileRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Choose File
          </button>
          {fileName && <p className="text-sm text-slate-500">{fileName}</p>}
          {Object.keys(fileHashes).length > 0 && (
            <div className="space-y-2">
              {Object.entries(fileHashes).map(([k, v]) => <HashRow key={k} label={k} value={v} />)}
            </div>
          )}
        </div>

        {/* Hash comparison */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold">Verify / Compare Hash</h2>
          <p className="text-sm text-slate-500">Paste an expected hash to verify against the text hash above.</p>
          <input
            type="text"
            className="input font-mono text-sm"
            placeholder="Paste expected hash here…"
            onChange={e => {
              const expected = e.target.value.trim().toLowerCase()
              const match = Object.values(hashes).find(h => h === expected)
              e.target.style.borderColor = expected
                ? (match ? '#22c55e' : '#ef4444')
                : ''
            }}
          />
        </div>
      </div>
    </ToolLayout>
  )
}
