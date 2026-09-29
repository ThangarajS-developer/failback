'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  BrainCircuit,
  Lightbulb,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { api } from '@/lib/api';
import { FailurePattern, AntiPattern } from '@/lib/types';

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<FailurePattern[]>([]);
  const [antiPatterns, setAntiPatterns] = useState<AntiPattern[]>([]);
  const [lessons, setLessons] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPatterns()
      .then((data) => {
        setPatterns(data.patterns || []);
        setAntiPatterns(data.anti_patterns || []);
        setLessons(data.lessons || []);
        setSummary(data.summary || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Recurring Failure Patterns & Anti-Patterns
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Hindsight reflection synthesizes repeated outage signatures, highlighting reflexive failed actions to avoid.
        </p>
      </div>

      {summary && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-xs font-mono text-cyan-300 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>{summary}</span>
        </div>
      )}

      {/* Main Patterns Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {patterns.map((pat, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                  Pattern #0{idx + 1}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold">
                  {pat.occurrences}x detected
                </span>
              </div>

              <h3 className="font-bold text-white text-base">{pat.title}</h3>

              <div className="text-xs space-y-1 font-mono text-slate-400">
                <div>
                  Affected services: <strong className="text-slate-200">{pat.services.join(', ')}</strong>
                </div>
                <div>
                  Common root cause:{' '}
                  <span className="text-slate-300 font-normal">{pat.common_root_cause}</span>
                </div>
              </div>

              {/* Failed Fixes (Red box) */}
              <div className="p-3.5 rounded-lg bg-red-950/30 border border-red-900/50 space-y-2 text-xs">
                <span className="font-bold text-red-300 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" />
                  REPEATED FAILED FIXES (DO NOT TRY):
                </span>
                <div className="space-y-1 font-mono text-[11px] text-red-200">
                  {pat.failed_fixes.map((f, fIdx) => (
                    <div key={fIdx} className="flex justify-between">
                      <span>❌ {f.action}</span>
                      <span className="text-red-400">{f.count}x failed</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Successful Fix (Green box) */}
              <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-900/50 space-y-1 text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  PROVEN ROOT-CAUSE FIX:
                </span>
                <p className="text-emerald-200 font-medium text-xs mt-1">
                  ✅ {pat.successful_fix}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Anti-Patterns & False Assumptions Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-rose-400" />
          <span>Engineering Anti-Patterns & Disproven Assumptions</span>
        </h3>
        <p className="text-xs text-slate-400">
          Reflexive habits that engineers instinctively attempt during high-stress outages that worsen downtime.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {antiPatterns.map((anti, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-300">{anti.name}</span>
                <span className="text-[10px] font-mono text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-500/30">
                  {anti.failure_rate}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{anti.lesson}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Institutional Lessons Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-400" />
          <span>Hindsight Accumulated Institutional Lessons</span>
        </h3>

        <div className="space-y-2">
          {lessons.map((lesson, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 flex items-start gap-3"
            >
              <span className="text-cyan-400 font-mono font-bold mt-0.5">0{idx + 1}.</span>
              <p className="leading-relaxed">{lesson}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
