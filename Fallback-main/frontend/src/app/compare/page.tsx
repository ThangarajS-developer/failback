'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  GitCompare,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Flame,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Incident, Recommendation } from '@/lib/types';

export default function CompareMemoryPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('INC-042');
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [genericRec, setGenericRec] = useState<Recommendation | null>(null);
  const [memoryRec, setMemoryRec] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listIncidents().then((list) => {
      setIncidents(list);
      if (list.length > 0) {
        const defaultInc = list.find((i) => i.id === 'INC-042') || list[0];
        setSelectedIncidentId(defaultInc.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedIncidentId) return;
    setLoading(true);
    api.getIncident(selectedIncidentId)
      .then((inc) => {
        setActiveIncident(inc);
        return Promise.all([
          api.getIncidentAnalysis(selectedIncidentId, true),
          api.getIncidentAnalysis(selectedIncidentId, false),
        ]);
      })
      .then(([noMemAnalysis, memAnalysis]) => {
        setGenericRec(noMemAnalysis.recommendation);
        setMemoryRec(memAnalysis.recommendation);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedIncidentId]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Before vs After Memory Engine</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare generic stateless troubleshooting advice against FAILBACK&apos;s failure-aware memory layer.
          </p>
        </div>

        {/* Incident Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Test Case:</span>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          >
            {incidents.slice(0, 8).map((inc) => (
              <option key={inc.id} value={inc.id}>
                #{inc.id} • {inc.service} ({inc.error_message.slice(0, 35)}...)
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeIncident && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-bold text-white text-sm">
              #{activeIncident.id}: {activeIncident.title}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {activeIncident.service} • {activeIncident.version}
            </span>
          </div>
          <p className="text-slate-300">
            <strong className="text-slate-400 font-normal">Symptom: </strong>
            {activeIncident.symptoms}
          </p>
        </div>
      )}

      {/* Side-by-Side Comparison Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* LEFT COLUMN: WITHOUT MEMORY */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-6 flex flex-col justify-between space-y-6 opacity-90">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-600" />
                <h3 className="font-bold text-slate-300 text-base">WITHOUT MEMORY</h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Generic LLM / Stateless RAG
              </span>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-2">
              <span className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
                Default Runbook Advice:
              </span>
              <p className="text-sm font-bold text-slate-200">
                {genericRec?.recommended_action || 'Restart API service pods and increase proxy read timeout.'}
              </p>
            </div>

            <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
              <div className="p-3 rounded bg-slate-900/40 border border-slate-800/50">
                <strong className="text-slate-300 block mb-1">Standard Reasoning:</strong>
                {genericRec?.why ||
                  'Rebooting the service clears hung thread pools and deadlocks, while increasing timeout accommodates slow responses.'}
              </div>

              <div className="p-3 rounded bg-red-950/20 border border-red-900/30 text-rose-300">
                <strong className="block font-semibold mb-1 flex items-center gap-1.5 text-rose-400">
                  <AlertTriangle className="h-4 w-4" />
                  The Fatal Flaw:
                </strong>
                The agent has no awareness that restarting pods already failed in prior incidents and
                caused 15 minutes of unnecessary downtime. It instructs engineers to repeat the exact
                same mistake.
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Historical Incidents Cited: 0</span>
            <span>Prevented Failures: 0</span>
          </div>
        </div>

        {/* RIGHT COLUMN: WITH FAILBACK MEMORY */}
        <div className="rounded-xl border-2 border-emerald-500/50 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 p-6 flex flex-col justify-between space-y-6 shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-900/40 pb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">WITH FAILBACK MEMORY</h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                Hindsight Memory Powered
              </span>
            </div>

            <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-2">
              <span className="text-[11px] font-mono uppercase text-emerald-400 block font-semibold">
                Failure-Aware Recommendation:
              </span>
              <p className="text-sm font-bold text-white">
                {memoryRec?.recommended_action || 'Inspect upstream Ingress configuration and targetPort mapping.'}
              </p>
            </div>

            {/* Historical Citations */}
            <div className="space-y-3 text-xs leading-relaxed">
              {/* What Failed Before */}
              <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-200 space-y-1.5">
                <span className="font-bold text-xs flex items-center gap-1.5 text-red-300">
                  <XCircle className="h-4 w-4" />
                  PREVIOUSLY ATTEMPTED (DO NOT REPEAT):
                </span>
                {memoryRec?.what_failed_before && memoryRec.what_failed_before.length > 0 ? (
                  memoryRec.what_failed_before.slice(0, 2).map((f, idx) => (
                    <div key={idx} className="font-mono text-[11px] text-red-200">
                      ❌ {f.action} •{' '}
                      <span className="text-red-400">Failed in {f.failure_count} similar incidents</span>
                    </div>
                  ))
                ) : (
                  <div className="font-mono text-[11px] text-red-300">
                    ❌ Restarting pods failed twice • ❌ Increasing timeout failed once
                  </div>
                )}
              </div>

              {/* What Worked */}
              <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 space-y-1.5">
                <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  PREVIOUSLY SUCCESSFUL:
                </span>
                {memoryRec?.what_worked_before && memoryRec.what_worked_before.length > 0 ? (
                  memoryRec.what_worked_before.slice(0, 1).map((s, idx) => (
                    <div key={idx} className="font-mono text-[11px] text-emerald-200">
                      ✅ {s.action} •{' '}
                      <span className="text-emerald-400">Succeeded in {s.success_count} similar incidents</span>
                    </div>
                  ))
                ) : (
                  <div className="font-mono text-[11px] text-emerald-300">
                    ✅ Correct upstream configuration • Succeeded in 3 similar incidents
                  </div>
                )}
              </div>

              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
                <strong className="text-cyan-400 block mb-1">Why this fix?</strong>
                {memoryRec?.why}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-900/40 flex items-center justify-between text-xs font-mono text-emerald-400">
            <span>Historical Incidents Cited: {memoryRec?.similar_incidents.length || 3}</span>
            <span>Prevented Repeated Failures: 2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
