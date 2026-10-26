import React, { useState } from 'react'
import {
  Play,
  RotateCcw,
  Sparkles,
  AlertOctagon,
  Plus,
  Trash2,
  FileSpreadsheet,
  HelpCircle,
  CheckCircle,
  Copy
} from 'lucide-react'

export default function InputForm({
  formData,
  setFormData,
  onEvaluate,
  onLoadPreset,
  onReset,
  loading
}) {
  const [chunksMode, setChunksMode] = useState('cards') // 'cards' | 'bulk'

  const handleQueryChange = (e) => {
    setFormData({ ...formData, query: e.target.value })
  }

  const handleGroundTruthChange = (e) => {
    setFormData({ ...formData, ground_truth: e.target.value })
  }

  const handleAnswerChange = (e) => {
    setFormData({ ...formData, answer: e.target.value })
  }

  // Chunks handling
  const handleChunkChange = (index, value) => {
    const newChunks = [...formData.retrieved_chunks]
    newChunks[index] = value
    setFormData({ ...formData, retrieved_chunks: newChunks })
  }

  const handleAddChunk = () => {
    setFormData({
      ...formData,
      retrieved_chunks: [...formData.retrieved_chunks, '']
    })
  }

  const handleRemoveChunk = (index) => {
    const newChunks = formData.retrieved_chunks.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      retrieved_chunks: newChunks.length > 0 ? newChunks : ['']
    })
  }

  const handleBulkChunksChange = (e) => {
    const raw = e.target.value
    // Split by double newline or custom delimiter
    const splitChunks = raw.split(/\n\s*\n/).map(c => c.trim()).filter(Boolean)
    setFormData({
      ...formData,
      retrieved_chunks: splitChunks.length > 0 ? splitChunks : [raw]
    })
  }

  const handleReset = () => {
    setFormData({
      query: '',
      ground_truth: '',
      retrieved_chunks: [''],
      answer: ''
    })
    if (onReset) {
      onReset()
    }
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      {/* Top Demo Presets Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Evaluation Input Console</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test custom RAG runs or click demo presets to observe evaluation metrics.
          </p>
        </div>

        {/* Two big buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onLoadPreset('pass')}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold tracking-wide transition-all duration-150 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Demo: Pass Scenario</span>
          </button>

          <button
            type="button"
            onClick={() => onLoadPreset('hallucination')}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold tracking-wide transition-all duration-150 hover:shadow-lg hover:shadow-red-500/10 active:scale-95 disabled:opacity-50"
          >
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span>Demo: Hallucination Scenario</span>
          </button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onEvaluate(); }} className="space-y-5">
        {/* Row 1: Query */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
            <span>1. User Query / Prompt</span>
            <span className="text-[10px] text-slate-500 font-normal">Used for Context Precision matching</span>
          </label>
          <input
            type="text"
            required
            value={formData.query}
            onChange={handleQueryChange}
            placeholder="e.g. How does self-attention compute token representations in Transformer models?"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Row 2: Ground Truth */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
            <span>2. Golden Reference / Ground Truth</span>
            <span className="text-[10px] text-slate-500 font-normal">Used for Context Recall calculation</span>
          </label>
          <textarea
            rows={2}
            value={formData.ground_truth}
            onChange={handleGroundTruthChange}
            placeholder="Reference expected answer containing essential factual tokens..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y"
          />
        </div>

        {/* Row 3: Retrieved Chunks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>3. Retrieved Context Chunks</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-indigo-300 border border-slate-700">
                {formData.retrieved_chunks.filter(c => c.trim()).length} chunk{formData.retrieved_chunks.filter(c => c.trim()).length === 1 ? '' : 's'}
              </span>
            </label>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setChunksMode(chunksMode === 'cards' ? 'bulk' : 'cards')}
                className="text-slate-400 hover:text-slate-200 transition-colors text-[11px] underline underline-offset-2"
              >
                Switch to {chunksMode === 'cards' ? 'Bulk Textarea' : 'Chunk Cards'}
              </button>
            </div>
          </div>

          {chunksMode === 'cards' ? (
            <div className="space-y-3">
              {formData.retrieved_chunks.map((chunk, idx) => (
                <div key={idx} className="relative group flex items-start gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center justify-center mt-1">
                    {idx + 1}
                  </div>
                  <div className="flex-grow">
                    <textarea
                      rows={2}
                      value={chunk}
                      onChange={(e) => handleChunkChange(idx, e.target.value)}
                      placeholder={`Retrieved Context Chunk [${idx + 1}]...`}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y"
                    />
                  </div>
                  {formData.retrieved_chunks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChunk(idx)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors mt-1"
                      title="Remove this chunk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddChunk}
                className="w-full py-2 border border-dashed border-slate-700/80 hover:border-indigo-500/60 rounded-xl text-xs font-medium text-slate-400 hover:text-indigo-300 bg-slate-900/40 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Context Chunk [{formData.retrieved_chunks.length + 1}]
              </button>
            </div>
          ) : (
            <div>
              <p className="text-[11px] text-slate-400 mb-1">
                Enter context chunks separated by blank lines (double newline).
              </p>
              <textarea
                rows={5}
                value={formData.retrieved_chunks.join('\n\n')}
                onChange={handleBulkChunksChange}
                placeholder="Chunk 1 content here...&#10;&#10;Chunk 2 content here...&#10;&#10;Chunk 3 content here..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
              />
            </div>
          )}
        </div>

        {/* Row 4: Generated Answer */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
            <span>4. RAG Generated Answer</span>
            <span className="text-[10px] text-slate-400 font-normal">
              Include inline citations like <code className="text-amber-400 font-mono">[1]</code> or <code className="text-amber-400 font-mono">[Source 2]</code>
            </span>
          </label>
          <textarea
            rows={3}
            required
            value={formData.answer}
            onChange={handleAnswerChange}
            placeholder="Generated answer to evaluate for faithfulness and citation fidelity..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y"
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl border border-transparent hover:border-slate-700/60 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Reset form inputs to empty state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Form
          </button>

          <button
            type="submit"
            disabled={loading}
            className="relative flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-sm tracking-wide shadow-lg shadow-indigo-500/25 transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Evaluating Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run RAG Evaluation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
