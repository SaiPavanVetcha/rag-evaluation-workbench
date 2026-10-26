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

// Circular progress indicator component for metric cards
function MetricCircleIndicator({ value, colorClass }) {
  const radius = 14
  const circumference = 2 * Math.PI * radius
  const clampedValue = Math.min(1, Math.max(0, value))
  const strokeDashoffset = circumference - (clampedValue * circumference)

  return (
    <div className="relative w-9 h-9 flex-shrink-0 flex items-center justify-center">
      <svg className="w-9 h-9 -rotate-90 transform" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r={radius}
          className="stroke-slate-800"
          strokeWidth="3.5"
          fill="none"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          className={`${colorClass} transition-all duration-700 ease-out`}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="absolute text-[9px] font-mono font-bold text-slate-300">
        {Math.round(clampedValue * 100)}
      </span>
    </div>
  )
}

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
          bg: 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400',
          badge: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30',
          bar: 'from-emerald-500 to-teal-400',
          glow: 'glow-card-green',
          accent: 'text-emerald-400',
          icon: CheckCircle2
        }
      case 'B':
        return {
          bg: 'bg-blue-950/20 border-blue-500/40 text-blue-400',
          badge: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black shadow-lg shadow-blue-500/30',
          bar: 'from-blue-500 to-indigo-400',
          glow: 'glow-card',
          accent: 'text-blue-400',
          icon: CheckCircle2
        }
      case 'C':
        return {
          bg: 'bg-amber-950/20 border-amber-500/40 text-amber-400',
          badge: 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400 text-slate-950 font-black shadow-lg shadow-amber-500/30',
          bar: 'from-amber-500 to-yellow-400',
          glow: 'glow-card-amber',
          accent: 'text-amber-400',
          icon: AlertTriangle
        }
      default:
        return {
          bg: 'bg-red-950/25 border-red-500/50 text-red-400',
          badge: 'bg-gradient-to-r from-red-600 via-rose-500 to-red-500 text-white font-black shadow-lg shadow-red-500/30',
          bar: 'from-red-600 to-rose-400',
          glow: 'glow-card-red',
          accent: 'text-red-400',
          icon: XCircle
        }
    }
  }

  const gradeStyle = getGradeStyle(grade)
  const GradeIcon = gradeStyle.icon

  return (
    <div className="space-y-6">
      {/* Overall Score Hero Card */}
      <div className={`p-6 sm:p-7 rounded-2xl border backdrop-blur-md transition-all duration-300 ${gradeStyle.bg} ${gradeStyle.glow}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* Prominent Overall Score Badge with Gradient Pill */}
            <div className="relative flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-900/90 border-2 border-slate-700/80 shadow-2xl flex-shrink-0">
              <span className="text-3xl sm:text-4xl font-black tracking-tight font-mono text-white">
                {Math.round(overall_score * 100)}%
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
                Overall Score
              </span>
              <div
                className={`absolute -top-3 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${gradeStyle.badge}`}
              >
                Grade {grade}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <GradeIcon className={`w-5 h-5 ${gradeStyle.accent}`} />
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100">
                  Overall Evaluation Benchmark
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {verdict}
              </p>
              <div className="pt-1 text-xs font-mono text-slate-400 flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 text-[11px]">
                  Formula: 0.25·Recall + 0.20·Precision + 0.35·Faithfulness + 0.20·Citation
                </span>
              </div>
            </div>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800/80">
            <div className="text-left md:text-right">
              <span className="text-xs uppercase tracking-wider text-slate-400 block font-medium">Pipeline Status</span>
              <span className={`text-sm sm:text-base font-bold ${overall_score >= 0.8 ? 'text-emerald-400' : overall_score >= 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
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
            <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono border border-indigo-500/20 font-semibold">
              Weight 25%
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight block">
                {(context_recall * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400">
                {details.context_recall.matched_tokens_count}/{details.context_recall.gt_tokens_count} GT Tokens
              </span>
            </div>
            <MetricCircleIndicator value={context_recall} colorClass="stroke-indigo-400" />
          </div>

          {/* Subtle Progress Bar */}
          <div className="w-full bg-slate-950/80 p-0.5 border border-slate-800 rounded-full h-2.5 mb-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full rounded-full transition-all duration-700 ease-out shadow-sm shadow-indigo-500/20"
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
            <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/20 font-semibold">
              Weight 20%
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight block">
                {(context_precision * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400">
                {details.context_precision.relevant_chunks}/{details.context_precision.total_chunks} Relevant Chunks
              </span>
            </div>
            <MetricCircleIndicator value={context_precision} colorClass="stroke-cyan-400" />
          </div>

          {/* Subtle Progress Bar */}
          <div className="w-full bg-slate-950/80 p-0.5 border border-slate-800 rounded-full h-2.5 mb-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full transition-all duration-700 ease-out shadow-sm shadow-cyan-500/20"
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
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono border border-emerald-500/20 font-semibold">
              Weight 35%
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight block">
                {(faithfulness * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400">
                {details.faithfulness.supported_sentences}/{details.faithfulness.total_sentences} Grounded Claims
              </span>
            </div>
            <MetricCircleIndicator
              value={faithfulness}
              colorClass={faithfulness >= 0.7 ? 'stroke-emerald-400' : faithfulness >= 0.4 ? 'stroke-amber-400' : 'stroke-red-400'}
            />
          </div>

          {/* Subtle Progress Bar */}
          <div className="w-full bg-slate-950/80 p-0.5 border border-slate-800 rounded-full h-2.5 mb-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${
                faithfulness >= 0.7
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-400 shadow-emerald-500/20'
                  : faithfulness >= 0.4
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-400 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-red-600 to-rose-400 shadow-red-500/20'
              }`}
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
            <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20 font-semibold">
              Weight 20%
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight block">
                {(citation_accuracy * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400">
                {details.citation_accuracy.valid_citations}/{details.citation_accuracy.total_citations} Valid Inline Tags
              </span>
            </div>
            <MetricCircleIndicator
              value={citation_accuracy}
              colorClass={citation_accuracy >= 0.7 ? 'stroke-amber-400' : 'stroke-red-400'}
            />
          </div>

          {/* Subtle Progress Bar */}
          <div className="w-full bg-slate-950/80 p-0.5 border border-slate-800 rounded-full h-2.5 mb-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${
                citation_accuracy >= 0.7
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-400 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-red-600 to-rose-400 shadow-red-500/20'
              }`}
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
