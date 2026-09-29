'use client';

import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Layers,
  Database,
  RefreshCw,
  Trash2,
  Download,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { MemoryUnit } from '@/lib/types';

const CATEGORIES = [
  { id: '', label: 'All Knowledge' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'failures', label: 'Failed Fixes' },
  { id: 'fixes', label: 'Successful Fixes' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'lessons', label: 'Lessons' },
];

export default function MemoryExplorerPage() {
  const [units, setUnits] = useState<MemoryUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const loadMemories = async () => {
    setLoading(true);
    try {
      const data = await api.getMemoryUnits(selectedCategory || undefined, search || undefined);
      setUnits(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [selectedCategory]);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await api.seedMemoryBank();
      setActionNotice(res.message);
      await loadMemories();
    } catch (e: any) {
      setActionNotice(`Error: ${e.message}`);
    } finally {
      setTimeout(() => setActionNotice(''), 4000);
    }
  };

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear the Hindsight memory bank for demo reset?')) return;
    setLoading(true);
    try {
      const res = await api.clearMemoryBank();
      setActionNotice(res.message);
      await loadMemories();
    } catch (e: any) {
      setActionNotice(`Error: ${e.message}`);
    } finally {
      setTimeout(() => setActionNotice(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Hindsight Memory Explorer</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Direct inspection of FAILBACK&apos;s institutional memory bank: stored troubleshooting journeys, failure anti-patterns, and lessons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSeed}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Seed 20 Synthetic Incidents</span>
          </button>

          <button
            onClick={handleClear}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900 hover:bg-red-950/60 hover:border-red-500/40 text-slate-300 hover:text-red-300 text-xs font-medium transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Bank</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-lg bg-blue-950 border border-blue-500/50 text-blue-200 text-xs font-mono animate-fadeIn">
          {actionNotice}
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search e.g. '502 nginx', 'timeout'..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadMemories()}
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Memory Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map((unit) => {
          const isFailure = unit.type === 'failed_attempt' || unit.type === 'failure';
          const isFix = unit.type === 'successful_fix' || unit.type === 'fix';

          return (
            <div
              key={unit.id}
              className={`rounded-xl border p-4 space-y-3 flex flex-col justify-between transition ${
                isFailure
                  ? 'border-red-900/60 bg-red-950/20'
                  : isFix
                  ? 'border-emerald-900/60 bg-emerald-950/20'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">#{unit.id}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                      isFailure
                        ? 'bg-red-950 text-red-400 border border-red-500/30'
                        : isFix
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-950 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {unit.type}
                  </span>
                </div>

                <h4 className="font-bold text-slate-100 text-sm">{unit.title}</h4>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {unit.content}
                </p>

                {/* Metadata highlights */}
                {unit.metadata && (
                  <div className="text-[11px] space-y-1 font-mono pt-2 border-t border-slate-800/80">
                    {unit.metadata.service && (
                      <div className="text-slate-400">
                        Service: <strong className="text-slate-200">{unit.metadata.service}</strong>
                      </div>
                    )}
                    {unit.metadata.root_cause && (
                      <div className="text-slate-400 truncate">
                        Root cause: <span className="text-slate-300">{unit.metadata.root_cause}</span>
                      </div>
                    )}
                    {unit.metadata.successful_fix && (
                      <div className="text-emerald-400 truncate">
                        Fix: {unit.metadata.successful_fix}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-1">
                {unit.tags.slice(0, 4).map((t, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono text-[10px]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {units.length === 0 && !loading && (
        <div className="py-16 text-center space-y-3 font-mono text-xs text-slate-400">
          <Database className="h-8 w-8 mx-auto text-slate-600" />
          <p>Memory bank is currently empty.</p>
          <button
            onClick={handleSeed}
            className="px-3.5 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold"
          >
            Seed 20 Synthetic Incidents into Hindsight
          </button>
        </div>
      )}
    </div>
  );
}
