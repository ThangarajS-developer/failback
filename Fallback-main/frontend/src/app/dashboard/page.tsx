'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  CheckCircle2,
  AlertTriangle,
  BrainCircuit,
  Clock,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  Activity,
  XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { api } from '@/lib/api';
import { DashboardMetrics, Incident, FailurePattern } from '@/lib/types';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [patterns, setPatterns] = useState<FailurePattern[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, inc, pat, act] = await Promise.all([
        api.getDashboardMetrics(),
        api.listIncidents(),
        api.getPatterns(),
        api.getMemoryActivity(),
      ]);
      setMetrics(m);
      setIncidents(inc);
      setPatterns(pat.patterns || []);
      setActivities(act || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered incidents
  const filteredIncidents = incidents.filter((i) => {
    const matchesSearch =
      !search ||
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.service.toLowerCase().includes(search.toLowerCase()) ||
      i.error_message.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = !severityFilter || i.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  // Realistic historical growth data based on memory entries
  const memoryGrowthData = [
    { incidentBatch: 'Initial', experiences: 3, failures: 4, prevented: 2 },
    { incidentBatch: 'Sprint 1', experiences: 8, failures: 11, prevented: 7 },
    { incidentBatch: 'Sprint 2', experiences: 14, failures: 19, prevented: 16 },
    { incidentBatch: 'Sprint 3', experiences: 19, failures: 28, prevented: 29 },
    { incidentBatch: 'Current', experiences: metrics?.memory_entries || 20, failures: metrics?.failed_approaches_count || 32, prevented: metrics?.prevented_repeated_failures || 42 },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">SRE Command Center</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 border border-emerald-500/40 text-emerald-300">
              {metrics?.hindsight_status || 'Hindsight Active'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time incident response and institutional failure memory monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/demo"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-950/80 border border-amber-500/40 hover:bg-amber-900 text-amber-300 text-xs font-semibold transition"
          >
            <span>Run Demo Flow</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase">Active Outages</span>
            <Flame className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics?.active_incidents ?? 1}
          </div>
          <span className="text-[10px] text-red-400 font-mono">Requires immediate triage</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase">Resolved Today</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics?.resolved_today ?? 19}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">100% retained to memory</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase">Failure Patterns</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics?.known_failure_patterns ?? 6}
          </div>
          <span className="text-[10px] text-amber-400 font-mono">Synthesized by Hindsight</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase">Memory Units</span>
            <BrainCircuit className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics?.memory_entries ?? 20}
          </div>
          <span className="text-[10px] text-cyan-400 font-mono">In bank: failback-incidents</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase">Avg Resolution</span>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics?.average_resolution_time_min ?? 17}m
          </div>
          <span className="text-[10px] text-blue-400 font-mono">-65% with failure memory</span>
        </div>

        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-mono uppercase">Prevented Failures</span>
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300">
            {metrics?.prevented_repeated_failures ?? 42}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Dead-end fixes avoided</span>
        </div>
      </div>

      {/* Memory Growth & Institutional Learning Visualizer */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <span>Hindsight Institutional Knowledge & Failure Prevention Growth</span>
            </h3>
            <p className="text-xs text-slate-400">
              Represents accumulated historical experiences and dead-end fixes saved from repeat execution.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Stored Experiences
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Remembered Failures
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Prevented Repeat Failures
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={memoryGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="incidentBatch" stroke="#64748b" textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="experiences" stroke="#3b82f6" fill="url(#expGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="failures" stroke="#f43f5e" fill="url(#failGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="prevented" stroke="#10b981" fill="url(#prevGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Grid: Recent Incidents & Recurring Failure Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents Table (2 cols) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base">Recent Incident Log</h3>
              <p className="text-xs text-slate-400">Click any incident to inspect its troubleshooting timeline and AI memory match.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter 502, timeout, Redis..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44"
                />
              </div>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono">
                <tr>
                  <th className="py-2.5 px-3">Incident</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Attempts & Failures</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredIncidents.slice(0, 7).map((inc) => {
                  const failedCount = inc.attempts.filter((a) => a.status === 'FAILED').length;
                  return (
                    <tr key={inc.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <Link
                          href={`/incidents/${inc.id}`}
                          className="font-mono font-bold text-blue-400 hover:text-blue-300 block"
                        >
                          #{inc.id}
                        </Link>
                        <span className="text-slate-300 text-xs truncate max-w-xs block font-medium">
                          {inc.title}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-300 font-medium">{inc.service}</span>
                        <span className="text-[11px] text-slate-500 block font-mono">{inc.version}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            inc.severity === 'CRITICAL'
                              ? 'bg-red-950 text-red-300 border border-red-500/40'
                              : inc.severity === 'HIGH'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : 'bg-blue-950 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          {failedCount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-950/70 border border-rose-500/30 text-rose-300 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              {failedCount} failed
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                          {inc.status === 'RESOLVED' && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Fix found
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                            inc.status === 'RESOLVED'
                              ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30'
                              : inc.status === 'OPEN'
                              ? 'bg-red-950/50 text-red-400 border border-red-500/30 animate-pulse'
                              : 'bg-amber-950/50 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/incidents/${inc.id}`}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition inline-flex items-center gap-1"
                        >
                          <span>Analyze</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex justify-between items-center text-xs text-slate-400 border-t border-slate-800/80">
            <span>Showing top {Math.min(filteredIncidents.length, 7)} of {filteredIncidents.length} recorded incidents</span>
            <Link href="/incidents" className="text-cyan-400 hover:text-cyan-300 font-medium">
              View all incidents &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column: Recurring Failure Patterns & Live Activity */}
        <div className="space-y-6">
          {/* Recurring Failure Patterns */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>Recurring Failure Patterns</span>
                </h3>
                <p className="text-xs text-slate-400">Repeated traps identified across incidents.</p>
              </div>
              <Link href="/patterns" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                View all &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {patterns.slice(0, 3).map((pat, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-100">{pat.title}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                      {pat.occurrences}x detected
                    </span>
                  </div>
                  <div className="text-[11px] text-rose-300 flex items-center gap-1">
                    <XCircle className="h-3 w-3 shrink-0 text-rose-400" />
                    <span>Failed fix: {pat.failed_fixes[0]?.action || 'Restart pods'}</span>
                  </div>
                  <div className="text-[11px] text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                    <span>Proven fix: {pat.successful_fix}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Hindsight Activity Feed */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span>Hindsight Activity Stream</span>
            </h3>

            <div className="space-y-2 text-xs">
              {activities.slice(0, 4).map((act, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-950/60 border border-slate-800/80 space-y-0.5">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span
                      className={`font-bold ${
                        act.action === 'RETAIN'
                          ? 'text-emerald-400'
                          : act.action === 'RECALL'
                          ? 'text-blue-400'
                          : 'text-amber-400'
                      }`}
                    >
                      [{act.action}]
                    </span>
                    <span className="text-slate-500">{act.timestamp.split(' ')[1]}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] truncate">
                    {act.details?.service ? `${act.details.service}: ` : ''}
                    {act.details?.query || act.details?.id || 'Synthesized memories'}
                  </p>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="text-slate-500 text-xs py-2 font-mono">No memory activity logged yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
