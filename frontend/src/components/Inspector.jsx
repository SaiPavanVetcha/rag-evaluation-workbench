import React, { useState } from 'react'
import {
  ShieldCheck,
  AlertOctagon,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Layers,
  Sparkles,
  ExternalLink,
  Target
} from 'lucide-react'

export default function Inspector({ result }) {
  if (!result || !result.details) return null

  const { faithfulness, citation_accuracy, context_precision, context_recall } = result.details
  const sentences = faithfulness.sentences || []
  const citations = citation_accuracy.citations || []
  const chunks = context_precision.chunks || []

  // Active filter: 'all' | 'grounded' | 'hallucinated' | 'mismatches'
  const [filter, setFilter] = useState('all')
  // Active tab: 'claims' | 'citations' | 'chunks' | 'recall'
  const [activeTab, setActiveTab] = useState('claims')
  const [expandedSentence, setExpandedSentence] = useState(null)

  // Filtered sentences
  const filteredSentences = sentences.filter((s) => {
    if (filter === 'grounded') return s.is_supported
    if (filter === 'hallucinated') return !s.is_supported
    if (filter === 'mismatches') {
      // Find if this sentence has any invalid citation
      const sentCitations = citations.filter(c => c.sentence_id === s.sentence_id)
      return sentCitations.some(c => !c.is_valid)
    }
    return true
  })

  const hallucinatedCount = sentences.filter(s => !s.is_supported).length
  const groundedCount = sentences.filter(s => s.is_supported).length
  const citationMismatchCount = citations.filter(c => !c.is_valid).length

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold text-slate-100 tracking-tight">
              Claim Grounding & Hallucination Inspector
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deep-dive into sentence-level factual grounding, token hallucinations, and citation integrity.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'claims'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Claim Grounding ({sentences.length})
          </button>
          <button
            onClick={() => setActiveTab('citations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'citations'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Citations ({citations.length})
            {citationMismatchCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                {citationMismatchCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('chunks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'chunks'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chunks ({chunks.length})
          </button>
          <button
            onClick={() => setActiveTab('recall')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'recall'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Recall Tokens
          </button>
        </div>
      </div>

      {/* TAB 1: CLAIMS INSPECTION */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1">Filter Claims:</span>

            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Sentences ({sentences.length})
            </button>

            <button
              onClick={() => setFilter('grounded')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                filter === 'grounded'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-500/20'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Grounded ({groundedCount})
            </button>

            <button
              onClick={() => setFilter('hallucinated')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                filter === 'hallucinated'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-950/40 text-red-400 hover:bg-red-900/40 border border-red-500/20'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              Hallucinated ({hallucinatedCount})
            </button>

            {citationMismatchCount > 0 && (
              <button
                onClick={() => setFilter('mismatches')}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  filter === 'mismatches'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-950/40 text-amber-400 hover:bg-amber-900/40 border border-amber-500/20'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Citation Mismatches ({citationMismatchCount})
              </button>
            )}
          </div>

          {/* Sentence Cards List */}
          <div className="space-y-4">
            {filteredSentences.map((sent) => {
              const isSupported = sent.is_supported
              const sentCitations = citations.filter(c => c.sentence_id === sent.sentence_id)
              const hasCitationMismatch = sentCitations.some(c => !c.is_valid)
              const isExpanded = expandedSentence === sent.sentence_id

              return (
                <div
                  key={sent.sentence_id}
                  className={`rounded-xl border p-5 transition-all duration-200 ${
                    isSupported
                      ? 'border-l-4 border-l-emerald-500 border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 via-slate-900/70 to-slate-900/50 hover:border-emerald-500/70 glow-card-green'
                      : 'border-l-4 border-l-red-500 border-red-500/60 bg-gradient-to-r from-red-950/30 via-slate-900/80 to-slate-900/60 hover:border-red-500/80 glow-card-red'
                  }`}
                >
                  {/* Card Header Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono font-bold">
                        Claim #{sent.sentence_id}
                      </span>

                      {/* Grounded vs Hallucination Badge */}
                      {isSupported ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold tracking-wide shadow-sm shadow-emerald-950">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Grounded in Context
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/70 text-red-200 text-xs font-bold tracking-wide shadow-md shadow-red-950 animate-pulse">
                          <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                          Hallucination Detected
                        </span>
                      )}

                      {/* Overlap Percentage Badge */}
                      <span
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-bold text-xs border ${
                          isSupported
                            ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                            : 'bg-red-950/70 border-red-500/50 text-red-300'
                        }`}
                        title="Token overlap with retrieved context (Threshold: 55%)"
                      >
                        <span>{Math.round(sent.overlap_score * 100)}% Match</span>
                        <span className="text-[10px] text-slate-400 font-normal">/ 55% min</span>
                      </span>

                      {/* Citation Mismatch Tag if present (Yellow / Amber) */}
                      {hasCitationMismatch && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/25 border border-amber-500/60 text-amber-200 text-xs font-bold tracking-wide shadow-sm shadow-amber-950">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          Citation Mismatch
                        </span>
                      )}
                    </div>

                    {/* Overlap Visual Meter */}
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {Math.round(sent.overlap_score * 100)}%
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Req: ≥ 55%
                        </span>
                      </div>
                      <div className="w-16 bg-slate-950 p-0.5 border border-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isSupported ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(100, sent.overlap_score * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sentence Text */}
                  <div className="py-3">
                    <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-normal">
                      {sent.text}
                    </p>
                  </div>

                  {/* High-visibility Warning Callout for Citation Mismatches */}
                  {hasCitationMismatch && (
                    <div className="mt-1 mb-2 p-3 rounded-xl bg-amber-950/35 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2.5 shadow-inner">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>
                        <strong className="font-semibold text-amber-300">Citation Warning:</strong> One or more citations attached to this sentence failed verification (low overlap or out-of-range chunk ID).
                      </span>
                    </div>
                  )}

                  {/* Inline Citations in this Sentence */}
                  {sentCitations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-400" />
                        Citations in Claim:
                      </span>
                      {sentCitations.map((cit, cIdx) => (
                        <span
                          key={cIdx}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${
                            cit.is_valid
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-950/60 text-amber-200 border-2 border-amber-500/70 shadow-sm shadow-amber-500/20'
                          }`}
                        >
                          <span>{cit.citation_tag}</span>
                          <span className="text-[10px] opacity-80">
                            {cit.is_valid ? `(Chunk ${cit.chunk_id})` : '(Mismatch!)'}
                          </span>
                          {cit.is_valid ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Diagnostic Details Toggle */}
                  <div className="mt-3 pt-3 border-t border-slate-800/60">
                    <button
                      onClick={() => setExpandedSentence(isExpanded ? null : sent.sentence_id)}
                      className="text-xs text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide Token Breakdown' : 'Show Token Breakdown'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs animate-fadeIn">
                        {/* Hallucinated Tokens */}
                        {sent.hallucinated_tokens && sent.hallucinated_tokens.length > 0 ? (
                          <div>
                            <span className="font-semibold text-red-400 block mb-1">
                              Hallucinated / Missing from Context ({sent.hallucinated_tokens.length}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {sent.hallucinated_tokens.map((tok, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="px-2 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 font-mono text-[11px]"
                                >
                                  {tok}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-emerald-400 text-xs">
                            ✓ No hallucinated tokens detected in this sentence.
                          </div>
                        )}

                        {/* Supported Tokens */}
                        {sent.supported_tokens && sent.supported_tokens.length > 0 && (
                          <div>
                            <span className="font-semibold text-emerald-400 block mb-1">
                              Grounded in Context ({sent.supported_tokens.length}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {sent.supported_tokens.map((tok, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-[11px]"
                                >
                                  {tok}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CITATIONS DEEP-DIVE */}
      {activeTab === 'citations' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-100 block">Citation Accuracy Verification</span>
              <span className="text-slate-400">
                Checks that every inline reference like <code className="text-amber-400 font-mono">[1]</code> points to an existing chunk with ≥ 40% sentence token overlap.
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-mono font-bold text-amber-400">
                {citation_accuracy.valid_citations}/{citation_accuracy.total_citations} Valid
              </span>
            </div>
          </div>

          {citations.length === 0 ? (
            <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-400 text-sm">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              No inline citation tags detected in the generated answer.
            </div>
          ) : (
            <div className="space-y-3">
              {citations.map((cit, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    cit.is_valid
                      ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40'
                      : 'border-l-4 border-l-amber-500 bg-amber-950/25 border-amber-500/60 glow-card-amber hover:border-amber-500/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg border font-mono text-sm font-bold ${
                        cit.is_valid
                          ? 'bg-slate-800 border-slate-700 text-amber-300'
                          : 'bg-amber-950/70 border-amber-500/60 text-amber-200 shadow-sm shadow-amber-500/20'
                      }`}>
                        {cit.citation_tag}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">
                            Target: Context Chunk [{cit.chunk_id}]
                          </span>
                          {cit.is_valid ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Valid Grounding
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-bold border border-amber-500/70 shadow-sm shadow-amber-500/20 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              Citation Mismatch
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Attached to Claim #{cit.sentence_id}: "{cit.sentence_text}"
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-200 block">
                        {Math.round(cit.overlap_score * 100)}% Overlap
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Req: ≥ 40%
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs">
                    <span className="font-medium text-slate-300">Diagnostic Verdict: </span>
                    <span className={cit.is_valid ? 'text-emerald-400' : 'text-amber-400 font-medium'}>
                      {cit.reason}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONTEXT CHUNKS RELEVANCE */}
      {activeTab === 'chunks' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-100 block">Context Precision Analysis</span>
              <span className="text-slate-400">
                Measures whether each retrieved chunk contains substantive query keywords (≥ 25% query token overlap).
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-mono font-bold text-cyan-400">
                {context_precision.relevant_chunks}/{context_precision.total_chunks} Relevant
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {chunks.map((chunk) => (
              <div
                key={chunk.chunk_id}
                className={`p-4 rounded-xl border transition-all ${
                  chunk.is_relevant
                    ? 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40'
                    : 'bg-slate-950/60 border-slate-800/60 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-800/80 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-xs font-bold text-slate-300">
                      Chunk [{chunk.chunk_id}]
                    </span>
                    {chunk.is_relevant ? (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold border border-cyan-500/30 flex items-center gap-1">
                        <Target className="w-3 h-3 text-cyan-400" />
                        Relevant (≥ 25%)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700">
                        Irrelevant / Noise
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-300">
                    {Math.round(chunk.relevance_score * 100)}% Query Overlap
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
                  {chunk.text}
                </p>

                {chunk.matched_tokens && chunk.matched_tokens.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Matched Query Tokens:</span>
                    {chunk.matched_tokens.map((tok, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-[11px]"
                      >
                        {tok}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RECALL TOKENS INSPECTOR */}
      {activeTab === 'recall' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-100 block">Context Recall Token Alignment</span>
              <span className="text-slate-400">
                Ground Truth tokens verified to be present in retrieved context chunks vs missed tokens.
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-mono font-bold text-indigo-400">
                {context_recall.matched_tokens_count}/{context_recall.gt_tokens_count} Tokens
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matched Tokens */}
            <div className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Captured Ground Truth Tokens ({context_recall.matched_tokens?.length || 0})</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pt-1">
                {(context_recall.matched_tokens || []).map((tok, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs"
                  >
                    {tok}
                  </span>
                ))}
              </div>
            </div>

            {/* Missed Tokens */}
            <div className="p-4 rounded-xl bg-red-950/15 border border-red-500/30 space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
                <XCircle className="w-4 h-4" />
                <span>Missed by Retriever ({context_recall.missed_tokens?.length || 0})</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pt-1">
                {(context_recall.missed_tokens || []).length === 0 ? (
                  <span className="text-xs text-slate-400 italic">None! 100% of Ground Truth tokens were retrieved.</span>
                ) : (
                  (context_recall.missed_tokens || []).map((tok, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded bg-red-950/60 border border-red-500/40 text-red-300 font-mono text-xs"
                    >
                      {tok}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
