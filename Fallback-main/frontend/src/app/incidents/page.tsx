'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Search,
  Filter,
  PlusCircle,
  ArrowRight,
  XCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Incident } from '@/lib/types';

export default function IncidentsListPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.listIncidents({
        search: search || undefined,
        severity: severityFilter || undefined,
        service: serviceFilter || undefined,
        status: statusFilter || undefined,
      });
      setIncidents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [severityFilter, serviceFilter, statusFilter]);

  const services = Array.from(new Set(incidents.map((i) => i.service))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Incident Repository</h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical incident records, troubleshooting attempts, and failure memory units.
          </p>
        </div>

        <Link
          href="/incidents/new"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-sm w-fit"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Report Incident</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, error code, symptoms, or root cause..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadIncidents()}
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
          <option value="INVESTIGATING">Investigating</option>
        </select>

        <button
          onClick={loadIncidents}
          className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
        >
          Apply Filters
        </button>
      </div>

      {/* Incidents Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase">
              <tr>
                <th className="py-3 px-4">ID & Title</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Troubleshooting Attempts</th>
                <th className="py-3 px-4">Root Cause</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {incidents.map((inc) => {
                const failedCount = inc.attempts.filter((a) => a.status === 'FAILED').length;
                return (
                  <tr key={inc.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/incidents/${inc.id}`}
                        className="font-mono font-bold text-blue-400 hover:text-blue-300 block"
                      >
                        #{inc.id}
                      </Link>
                      <span className="text-slate-200 font-semibold block text-xs truncate max-w-xs">
                        {inc.title}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">{inc.timestamp}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-300 font-medium">{inc.service}</span>
                      <span className="text-[11px] text-slate-500 block font-mono">
                        {inc.environment} • {inc.version}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                      {inc.root_cause || <span className="text-slate-600 italic">Investigating...</span>}
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-right">
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

        {incidents.length === 0 && !loading && (
          <div className="py-12 text-center text-slate-400 text-xs font-mono">
            No incidents found matching current filters.
          </div>
        )}
      </div>
    </div>
  );
}
