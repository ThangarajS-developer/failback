'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  Clock,
  Server,
  FileCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BrainCircuit,
  ArrowRight,
  RefreshCw,
  Sparkles,
  GitBranch,
  HelpCircle,
  Eye,
  Activity,
  Layers,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Incident, IncidentAnalysisResponse } from '@/lib/types';
import ResolutionModal from '@/components/incident/ResolutionModal';

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id as string;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [analysis, setAnalysis] = useState<IncidentAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'RESOLVE' | 'FAIL' | null>(null);
  const [appliedNotice, setAppliedNotice] = useState(false);

  const loadIncidentAndAnalysis = async () => {
    setLoading(true);
    try {
      const [incData, analysisData] = await Promise.all([
        api.getIncident(incidentId),
        api.getIncidentAnalysis(incidentId),
      ]);
      setIncident(incData);
      setAnalysis(analysisData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (incidentId) {
      loadIncidentAndAnalysis();
    }
  }, [incidentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3 font-mono text-xs text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
        <span>Recalling incident history and failure memories from Hindsight...</span>
      </div>
    );
  }

  if (!incident || !analysis) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-white">Incident #{incidentId} Not Found</h2>
        <Link href="/dashboard" className="text-blue-400 hover:underline text-sm font-mono">
          &larr; Return to Dashboard
        </Link>
      </div>
    );
  }

  const rec = analysis.recommendation;
  const similarIncidents = rec.similar_incidents || [];
  const whatFailed = rec.what_failed_before || [];
  const whatWorked = rec.what_worked_before || [];

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
            <Link href="/incidents" className="hover:text-slate-200">
              Incidents
            </Link>
            <span>/</span>
            <span className="text-slate-200 font-bold">#{incident.id}</span>
            <span>/</span>
            <span>{incident.service}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">{incident.title}</h1>
            <span
              className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold ${
                incident.severity === 'CRITICAL'
                  ? 'bg-red-950 text-red-300 border border-red-500/40'
                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
              }`}
            >
              {incident.severity}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold ${
                incident.status === 'RESOLVED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'bg-blue-950 text-blue-300 border border-blue-500/40'
              }`}
            >
              {incident.status}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
              {incident.environment} • {incident.version}
            </span>
          </div>
        </div>

        {/* Resolution Workflow Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {incident.status !== 'RESOLVED' && (
            <>
              <button
                onClick={() => {
                  setAppliedNotice(true);
                  setTimeout(() => setAppliedNotice(false), 4000);
                }}
                className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Apply Recommendation</span>
              </button>

              <button
                onClick={() => setModalMode('FAIL')}
                className="px-3 py-2 rounded-md bg-red-950/80 border border-red-500/40 hover:bg-red-900 text-red-300 text-xs font-medium transition flex items-center gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5 text-red-400" />
                <span>Mark Failed</span>
              </button>

              <button
                onClick={() => setModalMode('RESOLVE')}
                className="px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark Resolved</span>
              </button>
            </>
          )}

          {incident.status === 'RESOLVED' && (
            <div className="px-3 py-1.5 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Resolved in {incident.time_to_resolution_minutes || 15} min • Retained to Hindsight</span>
            </div>
          )}
        </div>
      </div>

      {appliedNotice && (
        <div className="p-3 rounded-lg bg-blue-950 border border-blue-500/50 text-blue-200 text-xs flex items-center justify-between animate-fadeIn">
          <span>
            🚀 <strong>Recommendation Applied:</strong> Deploying configuration fix directly to{' '}
            {incident.service}. No pod restart required.
          </span>
          <button
            onClick={() => setModalMode('RESOLVE')}
            className="underline font-semibold hover:text-white"
          >
            Mark as Resolved &rarr;
          </button>
        </div>
      )}

      {/* Observability Ribbon */}
      <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-3">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-4 w-4 text-cyan-400" />
          <span>Hindsight Strategy: <strong className="text-white">TEMPR Semantic Multi-Signal</strong></span>
          <span className="text-slate-600">|</span>
          <span>Matched: <strong className="text-blue-400">{analysis.memory_retrieval_stats.relevant_incidents_found} incidents</strong></span>
          <span className="text-slate-600">|</span>
          <span>Remembered: <strong className="text-red-400">{analysis.memory_retrieval_stats.failed_approaches_found} failed attempts</strong></span>
        </div>
        <span className="text-emerald-400 font-semibold">
          ✓ Memory Active • {rec.confidence} Confidence
        </span>
      </div>

      {/* CORE RECOMMENDATION CARD */}
      <div className="rounded-xl border-2 border-blue-500/40 bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/30 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-cyan-400 tracking-wider">
                FAILBACK Evidence-Based Recommendation
              </span>
              <h2 className="text-lg font-bold text-white">
                {rec.recommended_action}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-xs text-slate-300">
              Priority: <strong className="text-white">{rec.priority}</strong>
            </span>
            <span
              className={`px-2.5 py-1 rounded font-mono text-xs font-bold ${
                rec.confidence === 'HIGH'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
              }`}
            >
              Confidence: {rec.confidence}
            </span>
          </div>
        </div>

        {/* Prevented Warning */}
        {rec.prevented_failed_attempts && rec.prevented_failed_attempts.length > 0 && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold">
                DO NOT ATTEMPT PREVIOUSLY FAILED ACTIONS:
              </strong>
              Historical memory records that attempting{' '}
              <span className="underline decoration-red-400 font-mono">
                {rec.prevented_failed_attempts.join(', ')}
              </span>{' '}
              repeatedly failed to address this failure pattern and triggered extended downtime.
            </div>
          </div>
        )}

        {/* 5-Point Explainability Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-4 space-y-1">
            <span className="text-xs font-mono uppercase text-blue-400 font-bold block">
              1. WHY THIS RECOMMENDATION?
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">{rec.why}</p>
          </div>

          <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-4 space-y-1">
            <span className="text-xs font-mono uppercase text-cyan-400 font-bold block">
              2. WHAT WAS CONSIDERED?
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">{rec.what_was_considered}</p>
          </div>

          <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-4 space-y-1">
            <span className="text-xs font-mono uppercase text-amber-400 font-bold block">
              3. WHAT IS DIFFERENT THIS TIME?
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">{rec.what_is_different_this_time}</p>
          </div>

          <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-4 space-y-1">
            <span className="text-xs font-mono uppercase text-emerald-400 font-bold block">
              4. WHAT WORKED HISTORICALLY?
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {whatWorked[0]
                ? `${whatWorked[0].action} succeeded in ${whatWorked[0].success_count} similar incidents.`
                : 'Validated configuration alignments.'}
            </p>
          </div>
        </div>
      </div>

      {/* DUAL MEMORY CARDS: WHAT FAILED BEFORE vs WHAT WORKED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WHAT FAILED BEFORE */}
        <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-red-900/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-red-900/40 text-red-400">
                <XCircle className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-100 text-sm tracking-wide">
                WHAT FAILED BEFORE (FAILURE MEMORY)
              </h3>
            </div>
            <span className="text-xs font-mono text-red-400 font-semibold">
              {whatFailed.reduce((acc, curr) => acc + curr.failure_count, 0)} historical attempts
            </span>
          </div>

          <div className="space-y-3">
            {whatFailed.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-slate-950/90 border border-red-900/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-300 text-sm">❌ {item.action}</span>
                  <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/30 font-mono text-[11px]">
                    Failed in {item.failure_count} {item.failure_count === 1 ? 'incident' : 'incidents'}
                  </span>
                </div>
                <div className="space-y-1">
                  {item.reasons.map((r, rIdx) => (
                    <p key={rIdx} className="text-slate-400 leading-relaxed pl-2 border-l border-red-800">
                      {r}
                    </p>
                  ))}
                </div>
                {item.sample_incidents && item.sample_incidents.length > 0 && (
                  <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 pt-1">
                    <span>Observed in:</span>
                    {item.sample_incidents.map((s) => (
                      <span key={s} className="px-1 py-0.5 rounded bg-slate-900 text-slate-400">
                        #{s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {whatFailed.length === 0 && (
              <div className="text-slate-500 text-xs py-4 text-center font-mono">
                No failed troubleshooting steps recorded for this specific profile yet.
              </div>
            )}
          </div>
        </div>

        {/* WHAT WORKED */}
        <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-emerald-900/40 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-100 text-sm tracking-wide">
                WHAT WORKED (VERIFIED FIXES)
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold">
              {whatWorked.reduce((acc, curr) => acc + curr.success_count, 0)} historical successes
            </span>
          </div>

          <div className="space-y-3">
            {whatWorked.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-slate-950/90 border border-emerald-900/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 text-sm">✅ {item.action}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-mono text-[11px]">
                    Successful in {item.success_count} {item.success_count === 1 ? 'incident' : 'incidents'}
                  </span>
                </div>
                {item.sample_incidents && item.sample_incidents.length > 0 && (
                  <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 pt-1">
                    <span>Validated in:</span>
                    {item.sample_incidents.map((s) => (
                      <span key={s} className="px-1 py-0.5 rounded bg-slate-900 text-emerald-400">
                        #{s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {whatWorked.length === 0 && (
              <div className="text-slate-500 text-xs py-4 text-center font-mono">
                No validated historical resolutions matched.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SIMILAR INCIDENTS SECTION */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-white text-base">
              Similar Historical Incidents Retrieved ({similarIncidents.length} Found)
            </h3>
            <p className="text-xs text-slate-400">
              Scored via multi-signal similarity: error codes, service signatures, and symptom overlap.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">Hindsight Memory Bank</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {similarIncidents.map((match) => (
            <div
              key={match.incident_id}
              className="rounded-lg border border-slate-800 bg-slate-950/80 p-4 space-y-3 text-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-blue-400">
                    #{match.incident_id}
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-blue-950 text-blue-300 border border-blue-500/40">
                    {Math.round(match.similarity_score * 100)}% Similarity Score
                  </span>
                </div>

                <h4 className="font-semibold text-slate-200 text-sm mb-1">{match.title}</h4>
                <p className="text-slate-400 line-clamp-2 text-[11px] mb-2">{match.symptoms}</p>

                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <strong className="text-slate-300">Root Cause:</strong>{' '}
                    <span className="text-slate-400">{match.root_cause}</span>
                  </div>

                  <div>
                    <strong className="text-red-400">What Failed:</strong>
                    <ul className="list-disc list-inside text-slate-400 space-y-0.5 mt-0.5">
                      {match.what_failed.map((f, fIdx) => (
                        <li key={fIdx} className="truncate">
                          {f.action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong className="text-emerald-400">What Worked:</strong>{' '}
                    <span className="text-emerald-300 font-medium">{match.what_worked}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500">
                <span>{match.date}</span>
                <span className="text-emerald-400 font-mono">RESOLVED</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VISUAL TROUBLESHOOTING TIMELINE */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-white text-base">Troubleshooting Journey & Timeline</h3>
            <p className="text-xs text-slate-400">
              Chronological log of detection, hypotheses, attempted fixes, and resolution confirmations.
            </p>
          </div>
          <button
            onClick={() => setModalMode('FAIL')}
            className="text-xs px-2.5 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            + Add Attempt
          </button>
        </div>

        <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
          {analysis.timeline.map((event, idx) => (
            <div key={idx} className="relative group">
              {/* Dot icon */}
              <div
                className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-slate-950 ${
                  event.status === 'FAILED'
                    ? 'bg-red-500'
                    : event.status === 'SUCCESS'
                    ? 'bg-emerald-500'
                    : event.type === 'DETECTION'
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
              />

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500">{event.timestamp}</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                      event.status === 'FAILED'
                        ? 'bg-red-950 text-red-400 border border-red-500/30'
                        : event.status === 'SUCCESS'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {event.status || event.type}
                  </span>
                </div>

                <h4 className="font-bold text-slate-100 text-sm">{event.title}</h4>

                {event.hypothesis && (
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-300">Hypothesis:</strong> {event.hypothesis}
                  </p>
                )}

                <p className="text-xs text-slate-300 leading-relaxed">{event.description}</p>

                {event.engineer_notes && (
                  <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded border border-slate-800/80">
                    &ldquo;{event.engineer_notes}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Logs & Technical Telemetry Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
          <FileCode className="h-4 w-4 text-slate-400" />
          <span>Raw Log Stream & Infrastructure Context</span>
        </h3>
        <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {incident.logs}
        </pre>
        {incident.infrastructure_details && (
          <p className="text-xs text-slate-400 font-mono">
            Infra: {incident.infrastructure_details}
          </p>
        )}
      </div>

      {/* Modal for Resolution or Failure Recording */}
      {modalMode && (
        <ResolutionModal
          isOpen={true}
          onClose={() => setModalMode(null)}
          incidentId={incident.id}
          mode={modalMode}
          onSuccess={loadIncidentAndAnalysis}
        />
      )}
    </div>
  );
}
