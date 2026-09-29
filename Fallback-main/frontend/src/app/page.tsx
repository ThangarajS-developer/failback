import Link from 'next/link';
import {
  ShieldAlert,
  ArrowRight,
  PlayCircle,
  BrainCircuit,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  GitCompare,
  TrendingUp,
  Cpu,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950 p-8 sm:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-mono">
            <BrainCircuit className="h-4 w-4 text-cyan-400" />
            <span>HackWithHyderabad 3.0 • Powered by Hindsight AI Memory Layer</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            FAILBACK
            <span className="block text-xl sm:text-2xl font-normal text-slate-400 mt-2 font-mono">
              Failure-Aware Incident Learning Agent
            </span>
          </h1>

          <blockquote className="border-l-4 border-red-500 pl-4 py-1 text-xl sm:text-2xl font-semibold text-slate-200 italic">
            &ldquo;Your team&apos;s failed fixes shouldn&apos;t have to fail twice.&rdquo;
          </blockquote>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            When production outages occur, engineers repeatedly burn critical hours attempting fixes that
            already failed in previous incidents. <strong className="text-white">FAILBACK</strong> remembers
            the <em className="text-cyan-400 not-italic">entire troubleshooting journey</em>: hypotheses,
            failed actions, reasons for failure, validated fixes, and environmental drift.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-600/20"
            >
              <span>Launch SRE Console</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/demo"
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-amber-500/40 bg-amber-950/40 hover:bg-amber-950/70 text-amber-300 font-semibold transition"
            >
              <PlayCircle className="h-5 w-5 text-amber-400" />
              <span>Run Memory Learning Demo</span>
            </Link>

            <Link
              href="/compare"
              className="flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-medium transition"
            >
              <GitCompare className="h-4 w-4 text-cyan-400" />
              <span>Without Memory vs With Memory</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Conceptual Flow Diagram */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            The Failure-Aware Learning Loop
          </h2>
          <p className="text-sm text-slate-400">
            FAILBACK does not just store runbook documents—it captures real engineering trial and error.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              step: '01',
              title: 'INCIDENT',
              desc: 'Telemetry, logs, symptoms & environment recorded',
              icon: Flame,
              color: 'text-red-400 border-red-500/30 bg-red-950/20',
            },
            {
              step: '02',
              title: 'MEMORY',
              desc: 'Hindsight recalls multi-signal historical context',
              icon: BrainCircuit,
              color: 'text-blue-400 border-blue-500/30 bg-blue-950/20',
            },
            {
              step: '03',
              title: 'FAILED ATTEMPTS',
              desc: 'Explicitly flags what previously failed and why',
              icon: XCircle,
              color: 'text-rose-400 border-rose-500/30 bg-rose-950/20',
            },
            {
              step: '04',
              title: 'PROVEN FIXES',
              desc: 'Prioritizes historically validated root-cause fixes',
              icon: CheckCircle2,
              color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20',
            },
            {
              step: '05',
              title: 'LEARNING',
              desc: 'Human feedback & new attempts retained to Hindsight',
              icon: TrendingUp,
              color: 'text-amber-400 border-amber-500/30 bg-amber-950/20',
            },
            {
              step: '06',
              title: 'FASTER TRIAGE',
              desc: 'Repeated downtime anti-patterns permanently prevented',
              icon: Clock,
              color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`rounded-xl border p-4 flex flex-col justify-between transition hover:border-slate-600 ${item.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono opacity-60">STEP {item.step}</span>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-sm tracking-wide text-slate-100">{item.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-snug">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* The Core Innovation Showcase Card */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-mono uppercase text-cyan-400 tracking-wider">
              Real-World SRE Scenario
            </span>
            <h3 className="text-xl font-bold text-white mt-1">
              Incident #INC-042 • 502 Bad Gateway
            </h3>
          </div>
          <span className="px-3 py-1 rounded bg-red-950 border border-red-500/50 text-red-300 text-xs font-mono font-semibold">
            CRITICAL SEVERITY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* What Failed Before */}
          <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-5 space-y-3">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <XCircle className="h-5 w-5 shrink-0" />
              <span>WHAT FAILED BEFORE (AVOID REPEATING)</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded bg-slate-950/80 border border-red-900/40">
                <div className="font-semibold text-red-300 flex items-center justify-between">
                  <span>❌ Restart Payment API pods</span>
                  <span className="text-[10px] font-mono text-red-400">Failed in 2 incidents</span>
                </div>
                <p className="text-slate-400 mt-1">
                  Pods restarted in 45s but 502 connection timeouts persisted; added 30s of unnecessary pod termination overhead.
                </p>
              </div>
              <div className="p-3 rounded bg-slate-950/80 border border-red-900/40">
                <div className="font-semibold text-red-300 flex items-center justify-between">
                  <span>❌ Increase proxy_read_timeout to 120s</span>
                  <span className="text-[10px] font-mono text-red-400">Failed in 1 incident</span>
                </div>
                <p className="text-slate-400 mt-1">
                  Did not fix the root issue; merely prolonged client wait times and exhausted ingress connection sockets.
                </p>
              </div>
            </div>
          </div>

          {/* What Worked */}
          <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>WHAT WORKED (CONFIRMED ROOT CAUSE)</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded bg-slate-950/80 border border-emerald-900/40">
                <div className="font-semibold text-emerald-300 flex items-center justify-between">
                  <span>✅ Correct upstream targetPort mapping in Ingress ConfigMap</span>
                  <span className="text-[10px] font-mono text-emerald-400">Succeeded in 3 incidents</span>
                </div>
                <p className="text-slate-400 mt-1">
                  Identified port mismatch between Ingress targetPort 8080 and container listener port 8000. 502s dropped to 0% in 15 seconds.
                </p>
              </div>
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
                <strong className="text-white block mb-1">FAILBACK Recommendation:</strong>
                Investigate upstream Ingress port mapping first before attempting pod restarts or timeout tuning.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-3">
          <div className="h-10 w-10 rounded-lg bg-blue-950 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white text-base">Hindsight Persistent Memory</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Not a simple static vector database. Hindsight actively manages agent disposition,
            retains structured troubleshooting journeys, recalls multi-signal context via TEMPR,
            and reflects on recurring failure classes over time.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-3">
          <div className="h-10 w-10 rounded-lg bg-red-950 border border-red-500/40 flex items-center justify-center text-red-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white text-base">Negative Learning Retention</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Most systems only record what worked. FAILBACK explicitly records why hypotheses were
            disproven, preserving institutional knowledge so junior engineers don&apos;t repeat the
            exact same dead-end attempts during critical incidents.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6 space-y-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-white text-base">Explainable Recommendations</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Zero black-box hallucinations. Every recommendation explicitly breaks down:
            Why this fix? What failed before? What was considered? What is different this time?
            With similarity scores instead of pseudo-scientific probabilities.
          </p>
        </div>
      </section>
    </div>
  );
}
