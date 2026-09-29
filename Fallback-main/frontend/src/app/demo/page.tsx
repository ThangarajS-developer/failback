'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlayCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  BrainCircuit,
  ArrowRight,
  Sparkles,
  Flame,
  AlertTriangle,
  Clock,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';

const STAGES = [
  {
    num: 1,
    title: 'Stage 1: Fresh Agent (Zero Memory)',
    desc: 'Simulate a newly deployed agent with zero historical incident memories in Hindsight.',
  },
  {
    num: 2,
    title: 'Stage 2: Teach FAILBACK',
    desc: 'Inject 3 real historical incidents with complete troubleshooting journeys into Hindsight.',
  },
  {
    num: 3,
    title: 'Stage 3: New Outage Strikes',
    desc: 'Submit a new 502 Bad Gateway incident following a deployment.',
  },
  {
    num: 4,
    title: 'Stage 4: Failure-Aware Recommendation',
    desc: 'Hindsight recalls past failures: flags pod restart as dead-end and recommends upstream fix.',
  },
  {
    num: 5,
    title: 'Stage 5: Learn & Retain Again',
    desc: 'Resolution confirmed and retained. Memory bank count increases from 3 to 4.',
  },
];

export default function DemoPage() {
  const [currentStage, setCurrentStage] = useState(1);
  const [stageData, setStageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [demoLog, setDemoLog] = useState<string[]>([]);

  const appendLog = (msg: string) => {
    setDemoLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const executeStage = async (stageNum: number) => {
    setLoading(true);
    setCurrentStage(stageNum);
    try {
      const res = await api.executeDemoStep(stageNum);
      setStageData(res);
      appendLog(res.message || `Executed Stage ${stageNum}`);
    } catch (err: any) {
      appendLog(`Error in Stage ${stageNum}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setIsRunningAll(false);
    try {
      const res = await api.resetDemo();
      setCurrentStage(1);
      setStageData(res);
      setDemoLog([`[${new Date().toLocaleTimeString()}] Demo reset to Stage 1. Memory bank cleared.`]);
    } catch (err: any) {
      appendLog(`Reset error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runCompleteDemo = async () => {
    setIsRunningAll(true);
    await handleReset();

    for (let step = 1; step <= 5; step++) {
      if (step > 1) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        await executeStage(step);
      }
    }
    setIsRunningAll(false);
  };

  useEffect(() => {
    // Initial load
    executeStage(1);
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PlayCircle className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Interactive 5-Stage Demo Mode</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Live presentation showcase demonstrating FAILBACK learning from historical failures via Hindsight.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={loading || isRunningAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Demo</span>
          </button>

          <button
            onClick={runCompleteDemo}
            disabled={loading || isRunningAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-600/20 disabled:opacity-50"
          >
            <PlayCircle className="h-4 w-4" />
            <span>{isRunningAll ? 'Running Automated Flow...' : 'Run Memory Learning Demo'}</span>
          </button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {STAGES.map((s) => (
          <button
            key={s.num}
            onClick={() => !isRunningAll && executeStage(s.num)}
            disabled={isRunningAll}
            className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
              currentStage === s.num
                ? 'border-amber-500 bg-amber-950/40 text-amber-200 shadow-md'
                : currentStage > s.num
                ? 'border-emerald-800 bg-emerald-950/20 text-emerald-300'
                : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold uppercase">Stage 0{s.num}</span>
              {currentStage > s.num ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : currentStage === s.num ? (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              ) : null}
            </div>
            <div className="font-semibold text-xs text-slate-200">{s.title.split(':')[1]}</div>
          </button>
        ))}
      </div>

      {/* STAGE DISPLAY AREA */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        {/* Stage Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono text-amber-400 uppercase font-bold tracking-wider">
              Active Demonstration Step
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">
              {STAGES[currentStage - 1].title}
            </h2>
            <p className="text-xs text-slate-300 mt-1">{STAGES[currentStage - 1].desc}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              Hindsight Bank: <strong className="text-cyan-400">{stageData?.stats?.total_memories ?? (currentStage >= 2 ? (currentStage === 5 ? 4 : 3) : 0)}</strong> units
            </div>
            {currentStage < 5 && (
              <button
                onClick={() => executeStage(currentStage + 1)}
                disabled={loading || isRunningAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
              >
                <span>Advance to Stage {currentStage + 1}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* STAGE SPECIFIC CONTENT */}
        {currentStage === 1 && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-red-950/20 border border-red-900/40 text-xs text-red-200 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold">Agent Memory is Fresh:</strong>
                Zero historical experiences recorded in Hindsight. The agent lacks institutional memory
                and falls back to generic trial-and-error heuristics.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Incoming Incident</span>
                <div className="font-bold text-white text-sm">502 Bad Gateway on /v1/checkout</div>
                <p className="text-slate-400">Occurred immediately following deployment of v2.5.0.</p>
                <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-slate-400">
                  upstream timed out (110: Connection timed out)
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className="text-[11px] font-mono text-amber-400 uppercase">
                  Generic Advice (Without Memory)
                </span>
                <div className="font-bold text-slate-200">
                  &ldquo;Restart API pods and increase proxy read timeout to 120s.&rdquo;
                </div>
                <p className="text-slate-400 leading-relaxed">
                  The agent reflexively recommends restarting pods because it does not know that this
                  previously failed in 3 consecutive incidents.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStage === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-200 flex items-start gap-2.5">
              <BrainCircuit className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold">Teaching Hindsight in Progress:</strong>
                Retaining 3 structured historical incident records with full troubleshooting journeys,
                failed attempts, root causes, and engineer feedback.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-blue-400">#INC-042 (Payment API)</div>
                <div className="text-red-400 font-mono text-[11px]">
                  ❌ Restart pods: FAILED (45s wasted)
                </div>
                <div className="text-red-400 font-mono text-[11px]">
                  ❌ Increase timeout: FAILED (cascade)
                </div>
                <div className="text-emerald-400 font-mono text-[11px]">
                  ✅ Ingress upstream config: SUCCESS
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-blue-400">#INC-031 (Checkout Service)</div>
                <div className="text-red-400 font-mono text-[11px]">
                  ❌ Restart canary: FAILED (refused)
                </div>
                <div className="text-emerald-400 font-mono text-[11px]">
                  ✅ Upstream HOST binding: SUCCESS
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-mono font-bold text-blue-400">#INC-017 (User Gateway)</div>
                <div className="text-red-400 font-mono text-[11px]">
                  ❌ Increase timeouts: FAILED (cascade)
                </div>
                <div className="text-emerald-400 font-mono text-[11px]">
                  ✅ Upstream fail_timeout: SUCCESS
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStage === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-900/40 text-xs text-blue-200 flex items-start gap-2.5">
              <Flame className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold">New Production Incident Detected:</strong>
                Payment API is throwing 502 Bad Gateway immediately after release v2.5.0.
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-3 font-mono">
              <div className="flex justify-between items-center text-slate-400">
                <span className="font-bold text-white text-sm">#INC-DEMO-001: 502 Bad Gateway</span>
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/40">CRITICAL</span>
              </div>
              <p className="text-slate-300 font-sans text-xs">
                Requests intermittently failing immediately following v2.5.0 deployment. 45% failure rate.
              </p>
              <pre className="p-2.5 rounded bg-slate-900 text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                upstream timed out while connecting to upstream: &quot;http://10.0.4.15:8080/v1/checkout&quot;
              </pre>
            </div>
          </div>
        )}

        {currentStage === 4 && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold">Hindsight Memory Recalled:</strong>
                Matched 3 historical incidents. FAILBACK explicitly flags previously failed approaches
                and prioritizes upstream configuration inspection.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Failed before */}
              <div className="p-4 rounded-lg bg-red-950/30 border border-red-900/50 space-y-2 text-xs">
                <span className="font-bold text-red-300 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4" />
                  PREVIOUSLY FAILED (AVOID):
                </span>
                <div className="space-y-1 font-mono text-[11px] text-red-200">
                  <div>❌ Restart API pods (Failed in 2 incidents)</div>
                  <div>❌ Increase proxy read timeout (Failed in 1 incident)</div>
                </div>
                <p className="text-slate-400 text-[11px] pt-1 border-t border-red-900/40">
                  Restarting the service does NOT fix upstream port mapping or proxy mismatches.
                </p>
              </div>

              {/* Succeeded before */}
              <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-900/50 space-y-2 text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  PREVIOUSLY SUCCESSFUL:
                </span>
                <div className="font-mono text-[11px] text-emerald-200">
                  ✅ Correct upstream configuration in Ingress (Succeeded in 3 incidents)
                </div>
                <div className="p-2 rounded bg-slate-950 text-slate-300 text-[11px]">
                  <strong>Recommendation:</strong> Investigate upstream port mapping first before attempting pod restart.
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStage === 5 && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-xs text-emerald-200 flex items-start gap-2.5">
              <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold text-sm">
                  The Learning Loop Completed!
                </strong>
                The engineer followed FAILBACK&apos;s advice, resolved the outage in 5 minutes without
                repeating dead-end restarts, and retained the new experience into Hindsight.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Prior Experience</span>
                <div className="text-2xl font-bold text-white mt-1">3 Incidents</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-mono text-cyan-400 uppercase">Current Experience</span>
                <div className="text-2xl font-bold text-emerald-400 mt-1">4 Incidents</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-mono text-amber-400 uppercase">Pattern Confidence</span>
                <div className="text-2xl font-bold text-amber-300 mt-1">+33% Strengthened</div>
              </div>
            </div>

            <blockquote className="p-4 rounded-lg bg-slate-950/90 border border-slate-800 text-xs text-slate-300 italic text-center font-mono">
              &ldquo;FAILBACK doesn&apos;t just remember how incidents were fixed. It remembers how engineers learned to fix them.&rdquo;
            </blockquote>
          </div>
        )}

        {/* Live Execution Log */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
          <span className="text-xs font-mono uppercase text-slate-400 font-semibold block">
            Demo Operation Log:
          </span>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 max-h-36 overflow-y-auto space-y-1">
            {demoLog.map((log, idx) => (
              <div key={idx} className="leading-relaxed text-[11px]">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
