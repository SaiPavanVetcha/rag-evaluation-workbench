import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Sparkles,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Github,
  BookOpen,
  Cpu,
  Layers,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react'

import InputForm from './components/InputForm'
import MetricCards from './components/MetricCards'
import Inspector from './components/Inspector'

// Base API URL configuration:
// - In production (e.g. deployed to Vercel), set VITE_API_URL to your backend URL (e.g. https://rag-bench-backend.onrender.com).
// - In local development, if VITE_API_URL is unset, defaults to '' which routes through Vite dev server proxy to http://127.0.0.1:8000.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

// Helper to provide friendly, actionable error messages especially when backend is unreachable
const getDetailedError = (err, fallback = 'Operation failed') => {
  const msg = err?.message || String(err || '')
  if (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('Network request failed') ||
    msg.includes('Load failed')
  ) {
    const targetUrl = API_BASE || 'http://127.0.0.1:8000'
    return {
      title: 'Backend Server Unreachable',
      description: `Unable to connect to the evaluation backend API at ${targetUrl}.`,
      hint: 'Make sure the FastAPI backend is running: python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload'
    }
  }
  return {
    title: 'Evaluation Error',
    description: msg || fallback,
    hint: null
  }
}

export default function App() {
  const [formData, setFormData] = useState({
    query: '',
    ground_truth: '',
    retrieved_chunks: [''],
    answer: ''
  })

  const [evaluationResult, setEvaluationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null) // null | { title, description, hint }
  const [toast, setToast] = useState(null) // null | { message, type }
  const [activeView, setActiveView] = useState('single') // 'single' | 'batch'
  const [batchResult, setBatchResult] = useState(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Auto-dismiss toast notification after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Toggle dark/light theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // On mount, auto-load the Pass Scenario preset to give a stunning first impression
  useEffect(() => {
    loadPreset('pass')
  }, [])

  const loadPreset = async (type) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/preset/${type}`)
      if (!res.ok) throw new Error(`Failed to load preset: ${res.statusText}`)
      const data = await res.json()
      setFormData({
        query: data.preset.query,
        ground_truth: data.preset.ground_truth,
        retrieved_chunks: data.preset.retrieved_chunks,
        answer: data.preset.answer
      })
      setEvaluationResult(data.evaluation)
      setToast({
        message: `Loaded ${type === 'pass' ? 'Pass Scenario' : 'Hallucination Scenario'} preset with pre-calculated metrics.`,
        type: 'info'
      })
    } catch (err) {
      console.error(err)
      setError(getDetailedError(err, 'Error loading preset'))
    } finally {
      setLoading(false)
    }
  }

  const handleEvaluate = async () => {
    if (!formData.query.trim()) {
      setError({
        title: 'Validation Error',
        description: 'Please provide a user query or prompt to evaluate.',
        hint: null
      })
      return
    }
    if (!formData.answer.trim()) {
      setError({
        title: 'Validation Error',
        description: 'Please provide a generated RAG answer to evaluate.',
        hint: null
      })
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: formData.query,
          ground_truth: formData.ground_truth,
          retrieved_chunks: formData.retrieved_chunks.filter(c => c && c.trim()),
          answer: formData.answer
        })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `Evaluation failed (${res.status})`)
      }

      const data = await res.json()
      setEvaluationResult(data)
      setToast({
        message: `Evaluation Complete! Score: ${Math.round(data.metrics.overall_score * 100)}% (Grade ${data.metrics.grade})`,
        type: 'success'
      })
    } catch (err) {
      console.error(err)
      setError(getDetailedError(err, 'Failed to complete evaluation'))
    } finally {
      setLoading(false)
    }
  }

  // Handle batch file upload (JSON or CSV)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setBatchLoading(true)
    setError(null)
    const bodyData = new FormData()
    bodyData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: bodyData
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Batch evaluation upload failed')
      }

      const data = await res.json()
      setBatchResult(data)
      setToast({
        message: `Batch processed: ${data.aggregate.total_samples} samples evaluated!`,
        type: 'success'
      })
    } catch (err) {
      console.error(err)
      setError(getDetailedError(err, 'Failed to upload and evaluate batch file'))
    } finally {
      setBatchLoading(false)
    }
  }

  const handleReset = () => {
    setEvaluationResult(null)
    setError(null)
    setFormData({
      query: '',
      ground_truth: '',
      retrieved_chunks: [''],
      answer: ''
    })
    setToast({
      message: 'Form inputs cleared.',
      type: 'info'
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 transition-colors duration-200">
      {/* Top Notification / Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/80 border-b border-indigo-500/20 px-4 py-2 text-center text-xs text-indigo-200">
        <span className="font-semibold text-white">⚡ Hacktoberfest / Infinity AI Forge Hackathon:</span> Pure software, model-free, deterministic RAG evaluation harness. Zero LLMs, Zero API keys.
      </div>

      {/* Main Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  RAG-Bench
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v1.0.0 OSS
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Automated RAG Evaluation & Hallucination Inspection Workbench
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher: Interactive vs Batch */}
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                onClick={() => setActiveView('single')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeView === 'single'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Interactive
              </button>
              <button
                onClick={() => setActiveView('batch')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeView === 'batch'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Batch Run
              </button>
            </div>

            {/* Quick badges */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                100% Deterministic
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Upgraded Clear Error Alert */}
        {error && (
          <div className="p-4 sm:p-5 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn shadow-xl shadow-red-950/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-200 text-sm">
                  {typeof error === 'object' ? error.title : 'Evaluation Notice'}
                </h4>
                <p className="text-xs text-red-300/90 mt-0.5 leading-relaxed">
                  {typeof error === 'object' ? error.description : error}
                </p>
                {typeof error === 'object' && error.hint && (
                  <div className="mt-2 text-[11px] text-red-300 font-mono bg-red-900/40 px-2.5 py-1.5 rounded-lg border border-red-800/60 inline-flex items-center gap-1.5">
                    <span>💡 Troubleshooting:</span>
                    <span>{error.hint}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
              <button
                onClick={() => setError(null)}
                className="px-3 py-1.5 rounded-lg bg-red-900/50 hover:bg-red-800/60 text-red-200 text-xs font-semibold border border-red-700/60 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* View 1: Interactive Workbench */}
        {activeView === 'single' && (
          <div className="space-y-8">
            {/* Input Form */}
            <InputForm
              formData={formData}
              setFormData={setFormData}
              onEvaluate={handleEvaluate}
              onLoadPreset={loadPreset}
              onReset={handleReset}
              loading={loading}
            />

            {/* Evaluation Results */}
            {evaluationResult && (
              <div className="space-y-8 animate-fadeIn">
                {/* Metric Summary Cards */}
                <MetricCards result={evaluationResult} />

                {/* Claim Grounding & Hallucination Inspector */}
                <Inspector result={evaluationResult} />
              </div>
            )}
          </div>
        )}

        {/* View 2: Batch Benchmark Mode */}
        {activeView === 'batch' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                <span>Batch Evaluation Benchmark</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Upload a JSON or CSV file containing multiple RAG test cases to compute aggregate metrics across your entire evaluation suite.
              </p>

              {/* Upload Dropzone */}
              <div className="mt-6 border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-8 text-center transition-all bg-slate-950/40">
                <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-200">
                  Select a JSON or CSV file to evaluate
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Requires columns/fields: <code className="text-indigo-300">query</code>, <code className="text-indigo-300">ground_truth</code>, <code className="text-indigo-300">retrieved_chunks</code>, and <code className="text-indigo-300">answer</code>.
                </p>

                <div className="mt-4">
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide cursor-pointer transition-all shadow-lg shadow-indigo-500/20">
                    <input
                      type="file"
                      accept=".json,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={batchLoading}
                    />
                    {batchLoading ? 'Evaluating Batch...' : 'Choose File'}
                  </label>
                </div>
              </div>
            </div>

            {/* Batch Results Aggregate Table */}
            {batchResult && (
              <div className="space-y-6 animate-fadeIn">
                {/* Aggregate Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400 block">Total Samples</span>
                    <span className="text-2xl font-bold font-mono text-white">
                      {batchResult.aggregate.total_samples}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-indigo-400 block">Avg Recall</span>
                    <span className="text-2xl font-bold font-mono text-indigo-300">
                      {(batchResult.aggregate.avg_context_recall * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-cyan-400 block">Avg Precision</span>
                    <span className="text-2xl font-bold font-mono text-cyan-300">
                      {(batchResult.aggregate.avg_context_precision * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-emerald-400 block">Avg Faithfulness</span>
                    <span className="text-2xl font-bold font-mono text-emerald-300">
                      {(batchResult.aggregate.avg_faithfulness * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-purple-400 block">Avg Overall</span>
                    <span className="text-2xl font-bold font-mono text-purple-300">
                      {(batchResult.aggregate.avg_overall_score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Samples Table */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="px-6 py-4 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-slate-100">
                      Batch Evaluation Samples Breakdown
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">#</th>
                          <th className="px-4 py-3">Query</th>
                          <th className="px-4 py-3 text-center">Recall</th>
                          <th className="px-4 py-3 text-center">Precision</th>
                          <th className="px-4 py-3 text-center">Faithfulness</th>
                          <th className="px-4 py-3 text-center">Citation</th>
                          <th className="px-4 py-3 text-center">Overall</th>
                          <th className="px-4 py-3 text-center">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {batchResult.samples.map((s) => {
                          const m = s.evaluation.metrics
                          return (
                            <tr key={s.sample_id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-slate-400">{s.sample_id}</td>
                              <td className="px-4 py-3 max-w-xs truncate text-slate-200 font-medium">{s.query}</td>
                              <td className="px-4 py-3 text-center font-mono text-indigo-300">{(m.context_recall * 100).toFixed(0)}%</td>
                              <td className="px-4 py-3 text-center font-mono text-cyan-300">{(m.context_precision * 100).toFixed(0)}%</td>
                              <td className="px-4 py-3 text-center font-mono text-emerald-300">{(m.faithfulness * 100).toFixed(0)}%</td>
                              <td className="px-4 py-3 text-center font-mono text-amber-300">{(m.citation_accuracy * 100).toFixed(0)}%</td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-white">{(m.overall_score * 100).toFixed(0)}%</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  m.grade === 'A+' || m.grade === 'A'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : m.grade === 'B'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                    : m.grade === 'C'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                                }`}>
                                  {m.grade}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-900 pt-8 pb-12 text-center text-xs text-slate-500">
        <p>
          RAG-Bench • Built for Hacktoberfest & Infinity AI Forge • Pure Software & Deterministic NLP Heuristics
        </p>
      </footer>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-toast flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border border-indigo-500/40 text-slate-100 shadow-2xl shadow-indigo-950/50 backdrop-blur-md max-w-md">
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400" />
            )}
          </div>
          <div className="flex-grow pr-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block">
              {toast.type === 'success' ? 'Evaluation Success' : 'System Notice'}
            </span>
            <p className="text-xs text-slate-200 mt-0.5 leading-snug">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-200 text-xs p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Dismiss toast"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
