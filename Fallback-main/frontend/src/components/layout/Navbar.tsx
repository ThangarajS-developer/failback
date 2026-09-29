'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  BrainCircuit,
  Terminal,
  Activity,
  PlusCircle,
  PlayCircle,
  MessageSquareCode,
  Layers,
  Sparkles,
  GitCompare,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardMetrics } from '@/lib/types';

interface NavbarProps {
  onToggleCopilot?: () => void;
}

export default function Navbar({ onToggleCopilot }: NavbarProps) {
  const pathname = usePathname();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    api.getDashboardMetrics()
      .then(setMetrics)
      .catch(() => {});
    const interval = setInterval(() => {
      api.getDashboardMetrics().then(setMetrics).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-red-950/80 border border-red-500/40 text-red-400 group-hover:border-red-400 transition">
              <ShieldAlert className="h-6 w-6" />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wider text-slate-100">FAILBACK</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-950 border border-blue-500/40 text-blue-300">
                  Hindsight Powered
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden md:block">
                Failure-Aware Incident Learning Agent
              </p>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-md transition ${
                pathname === '/dashboard'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/incidents"
              className={`px-3 py-1.5 rounded-md transition ${
                pathname.startsWith('/incidents') && pathname !== '/incidents/new'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Incidents
            </Link>
            <Link
              href="/compare"
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                pathname === '/compare'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <GitCompare className="h-3.5 w-3.5 text-cyan-400" />
              Before vs After
            </Link>
            <Link
              href="/memory"
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                pathname === '/memory'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BrainCircuit className="h-3.5 w-3.5 text-blue-400" />
              Memory Bank
            </Link>
            <Link
              href="/patterns"
              className={`px-3 py-1.5 rounded-md transition ${
                pathname === '/patterns'
                  ? 'bg-slate-800 text-slate-100 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Patterns
            </Link>
            <Link
              href="/demo"
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                pathname === '/demo'
                  ? 'bg-amber-950/70 border border-amber-500/50 text-amber-200 font-semibold'
                  : 'text-amber-400 hover:text-amber-200 hover:bg-amber-950/30'
              }`}
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Live Demo
            </Link>
          </nav>
        </div>

        {/* Right Action Area */}
        <div className="flex items-center gap-3">
          {/* Hindsight Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Bank: <strong className="text-blue-400">{metrics?.memory_bank_id || 'failback-incidents'}</strong></span>
            <span className="text-slate-600">|</span>
            <span>Memories: <strong className="text-emerald-400">{metrics?.memory_entries ?? '...'}</strong></span>
          </div>

          {/* New Incident Intake */}
          <Link
            href="/incidents/new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Report Incident</span>
          </Link>

          {/* Grounded Copilot Drawer Trigger */}
          {onToggleCopilot && (
            <button
              onClick={onToggleCopilot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-sm font-medium transition"
              title="Open Incident Copilot grounded in Hindsight"
            >
              <MessageSquareCode className="h-4 w-4 text-cyan-400" />
              <span className="hidden sm:inline">Copilot</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
