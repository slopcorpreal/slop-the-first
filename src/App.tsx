import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import VideoConverter from './pages/VideoConverter'
import BackgroundRemover from './pages/BackgroundRemover'
import ImageCompressor from './pages/ImageCompressor'
import QRGenerator from './pages/QRGenerator'
import JSONFormatter from './pages/JSONFormatter'
import Base64Tool from './pages/Base64Tool'
import RegexTester from './pages/RegexTester'
import MarkdownEditor from './pages/MarkdownEditor'
import HashGenerator from './pages/HashGenerator'
import TimestampConverter from './pages/TimestampConverter'
import URLEncoder from './pages/URLEncoder'
import TextDiff from './pages/TextDiff'
import ColorPalette from './pages/ColorPalette'
import CSSGradient from './pages/CSSGradient'

const BASE = '/slop-the-first'

export default function App() {
  return (
    <BrowserRouter basename={BASE}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/video-converter" element={<VideoConverter />} />
          <Route path="/background-remover" element={<BackgroundRemover />} />
          <Route path="/image-compressor" element={<ImageCompressor />} />
          <Route path="/qr-generator" element={<QRGenerator />} />
          <Route path="/json-formatter" element={<JSONFormatter />} />
          <Route path="/base64" element={<Base64Tool />} />
          <Route path="/regex-tester" element={<RegexTester />} />
          <Route path="/markdown-editor" element={<MarkdownEditor />} />
          <Route path="/hash-generator" element={<HashGenerator />} />
          <Route path="/timestamp" element={<TimestampConverter />} />
          <Route path="/url-encoder" element={<URLEncoder />} />
          <Route path="/text-diff" element={<TextDiff />} />
          <Route path="/color-palette" element={<ColorPalette />} />
          <Route path="/css-gradient" element={<CSSGradient />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
