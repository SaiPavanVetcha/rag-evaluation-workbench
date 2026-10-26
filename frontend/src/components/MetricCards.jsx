import React from 'react'
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  Target,
  ShieldCheck,
  FileText,
  Info
} from 'lucide-react'

export default function MetricCards({ result }) {
  if (!result || !result.metrics) return null

  const { metrics, details, summary } = result
  const {
    context_recall,
    context_precision,
    faithfulness,
    citation_accuracy,
    overall_score,
    grade,
    verdict
  } = metrics

  // Grade color scheme
  const getGradeStyle = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          badge: 'bg-emerald-500 text-slate-950 font-bold',
          bar: 'bg-emerald-500',
          ring: 'text-emerald-500',
          icon: CheckCircle2
        }
      case 'B':
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          badge: 'bg-blue-500 text-white font-bold',
          bar: 'bg-blue-500',
          ring: 'text-blue-500',
          icon: CheckCircle2
        }
      case 'C':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          badge: 'bg-amber-500 text-slate-950 font-bold',
          bar: 'bg-amber-500',
          ring: 'text-amber-500',
          icon: AlertTriangle
        }
      default:
        return {
          bg: 'bg-red-500/10 border-red-500/30 text-red-400',
          badge: 'bg-red-500 text-white font-bold',
          bar: 'bg-red-500',
          ring: 'text-red-500',
          icon: XCircle
        }
    }
  }

  const gradeStyle = getGradeStyle(grade)
  const GradeIcon = gradeStyle.icon

  return (
    <div className="space-y-6">
      {/* Overall Score Hero Card */}
      <div className={`p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${gradeStyle.bg} glow-card`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-900/80 border border-slate-700/50 shadow-inner">
              <span className="text-3xl font-extrabold tracking-tight font-mono">
                {Math.round(overall_score * 100)}%
              </span>
              <div
                className={`absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-xs uppercase tracking-wider shadow-lg ${gradeStyle.badge}`}
              >
                Grade {grade}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <GradeIcon className="w-5 h-5" />
                <h3 className="text-xl font-bold tracking-tight text-slate-100">
                  Overall Evaluation Benchmark
                </h3>
              </div>
              <p className="mt-1 text-sm text-slate-300 max-w-2xl leading-relaxed">
                {verdict}
              </p>
              <div className="mt-2 text-xs font-mono text-slate-400 flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
                  Formula: 0.25·Recall + 0.20·Precision + 0.35·Faithfulness + 0.20·Citation
                </span>
              </div>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
            <div className="text-left md:text-right">
              <span className="text-xs uppercase tracking-wider text-slate-400 block font-medium">Pipeline Status</span>
              <span className={`text-base font-semibold ${overall_score >= 0.8 ? 'text-emerald-400' : overall_score >= 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                {overall_score >= 0.8 ? 'PASSED / HIGH FIDELITY' : overall_score >= 0.5 ? 'WARNING / DRIFT DETECTED' : 'FAILED / CRITICAL DRIFT'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Context Recall */}
        <div className="bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/50 p-5 rounded-xl shadow-lg transition-all duration-200 backdrop-blur-sm group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              Context Recall
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono border border-indigo-500/20">
              Weight 25%
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
              {(context_recall * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">
              {details.context_recall.matched_tokens_count}/{details.context_recall.gt_tokens_count} GT Tokens
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, context_recall * 100))}%` }}
            />
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Measures the percentage of essential Ground Truth tokens retrieved in the context chunks.
          </p>
        </div>

        {/* Metric 2: Context Precision */}
        <div className="bg-slate-900/70 border border-slate-800/80 hover:border-cyan-500/50 p-5 rounded-xl shadow-lg transition-all duration-200 backdrop-blur-sm group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-cyan-400" />
              Context Precision
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/20">
              Weight 20%
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
              {(context_precision * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">
              {details.context_precision.relevant_chunks}/{details.context_precision.total_chunks} Relevant Chunks
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, context_precision * 100))}%` }}
            />
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Ratio of chunks containing substantive query keywords (≥ 25% overlap) to avoid noisy retrieval.
          </p>
        </div>

        {/* Metric 3: Faithfulness */}
        <div className="bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/50 p-5 rounded-xl shadow-lg transition-all duration-200 backdrop-blur-sm group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Faithfulness
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono border border-emerald-500/20">
              Weight 35%
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
              {(faithfulness * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">
              {details.faithfulness.supported_sentences}/{details.faithfulness.total_sentences} Grounded Claims
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${faithfulness >= 0.7 ? 'bg-emerald-500' : faithfulness >= 0.4 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, faithfulness * 100))}%` }}
            />
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Identifies hallucinations: checks that generated claims are firmly rooted in retrieved context (≥ 55% overlap).
          </p>
        </div>

        {/* Metric 4: Citation Accuracy */}
        <div className="bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/50 p-5 rounded-xl shadow-lg transition-all duration-200 backdrop-blur-sm group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              Citation Accuracy
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">
              Weight 20%
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
              {(citation_accuracy * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">
              {details.citation_accuracy.valid_citations}/{details.citation_accuracy.total_citations} Valid Inline Tags
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${citation_accuracy >= 0.7 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, citation_accuracy * 100))}%` }}
            />
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Verifies that inline citations like [1] or [Source N] actually support the specific claim (≥ 40% chunk overlap).
          </p>
        </div>
      </div>
    </div>
  )
}
