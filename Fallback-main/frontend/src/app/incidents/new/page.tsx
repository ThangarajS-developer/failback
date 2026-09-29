'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Flame,
  FileCode,
  Layers,
  ArrowRight,
  Sparkles,
  Server,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';

const SAMPLE_PRESETS = [
  {
    name: '⚡ 502 Bad Gateway after v2.5.0 Deployment (Payment API)',
    title: '502 Bad Gateway across Payment API after deployment',
    service: 'Payment API',
    severity: 'CRITICAL',
    environment: 'Production',
    error_message: '502 Bad Gateway: upstream timed out while connecting to backend',
    symptoms: 'Requests intermittently failing immediately following v2.5.0 deployment. 40% error rate on /v1/charges.',
    logs: '[error] 1421#1421: *892011 upstream timed out (110: Connection timed out) while connecting to upstream, client: 198.51.100.4, server: api.payments.internal, request: "POST /v1/charges HTTP/1.1", upstream: "http://10.0.4.15:8080/v1/charges"',
    version: 'v2.5.0',
    infrastructure_details: 'Kubernetes cluster us-east-1, AWS ALB -> Nginx Ingress Controller -> Gunicorn Pods',
    additional_context: 'Deployment changed ingress keepalive timeout and upstream routing port mapping.',
  },
  {
    name: '🛢️ PostgreSQL Connection Pool Exhaustion (Order Service)',
    title: 'PostgreSQL Connection Pool Exhaustion during Flash Sale',
    service: 'Order Management',
    severity: 'CRITICAL',
    environment: 'Production',
    error_message: 'FATAL: remaining connection slots are reserved for non-replication superuser connections',
    symptoms: 'Order placement stalling. Database connections pinned at 200/200 max connections.',
    logs: 'HikariPool-1 - Connection is not available, request timed out after 30000ms.\nFATAL: remaining connection slots are reserved for non-replication superuser connections',
    version: 'v4.2.1',
    infrastructure_details: 'AWS Aurora PostgreSQL 15.3, PgBouncer proxy',
    additional_context: 'Followed an email flash-sale broadcast campaign.',
  },
  {
    name: '🔴 Redis Timeouts & 100% CPU on Session Store',
    title: 'Redis Connection Timeouts during Spike in Session Store',
    service: 'Session Store',
    severity: 'CRITICAL',
    environment: 'Production',
    error_message: 'Redis::TimeoutError: Connection timed out - [Redis:6379] after 1000ms',
    symptoms: 'User logins failing with session timeout errors. Redis CPU pegged at 100% on master node.',
    logs: 'Redis::TimeoutError: Connection timed out - [redis.cache.internal:6379] command: GET sess:918237\n[SLOWLOG] 1) 1791989100 2) 421900us 3) KEYS sess:user:* 4) 10.0.8.21:44102',
    version: 'v3.4.2',
    infrastructure_details: 'Redis 7.2 Cluster AWS ElastiCache, 3 shards',
    additional_context: 'Background analytics batch job running simultaneously.',
  },
  {
    name: '🔑 Auth0 JWKS Key Rotation 401 Spike (Auth Gateway)',
    title: 'Auth Token Signature Verification Failure after JWKS Key Rotation',
    service: 'Authentication Service',
    severity: 'CRITICAL',
    environment: 'Production',
    error_message: 'JWT::InvalidSignature: Key ID (kid) not found in JWKS cache',
    symptoms: '100% of user API requests rejected with HTTP 401 Unauthorized across mobile and web clients.',
    logs: 'ERROR [auth.jwt] Token verification failed: Key ID auth-key-2026-09 not present in cached JWKS provider response. Remote fetch returned 429 Too Many Requests.',
    version: 'v5.1.0',
    infrastructure_details: 'Auth0 Identity Provider -> API Gateway JWT Verifier',
    additional_context: 'Scheduled IdP key rotation executed at top of hour.',
  },
];

export default function IncidentIntakePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    service: 'Payment API',
    severity: 'CRITICAL',
    environment: 'Production',
    error_message: '',
    symptoms: '',
    logs: '',
    version: 'v2.5.0',
    infrastructure_details: '',
    additional_context: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setFormData({
      title: preset.title,
      service: preset.service,
      severity: preset.severity,
      environment: preset.environment,
      error_message: preset.error_message,
      symptoms: preset.symptoms,
      logs: preset.logs,
      version: preset.version,
      infrastructure_details: preset.infrastructure_details,
      additional_context: preset.additional_context,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.error_message || !formData.symptoms) {
      setError('Title, Error Message, and Symptoms are required fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const created = await api.createIncident(formData);
      router.push(`/incidents/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit incident');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Report Production Incident</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            FAILBACK will immediately recall matching troubleshooting journeys and warn you about previously failed approaches.
          </p>
        </div>

        {/* 1-Click Preset Dropdown */}
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-xs text-slate-400 font-medium">Quick Demo Preset:</span>
          <select
            onChange={(e) => {
              const idx = Number(e.target.value);
              if (!isNaN(idx) && SAMPLE_PRESETS[idx]) {
                loadPreset(SAMPLE_PRESETS[idx]);
              }
            }}
            defaultValue=""
            className="bg-slate-900 border border-amber-500/40 rounded-md px-2.5 py-1.5 text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-400"
          >
            <option value="" disabled>Select realistic outage...</option>
            {SAMPLE_PRESETS.map((p, idx) => (
              <option key={idx} value={idx}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-950/80 border border-red-500/40 text-red-200 text-xs">
          {error}
        </div>
      )}

      {/* Main Intake Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
            1. Core Incident Identity
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Incident Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 502 Bad Gateway across Payment API after v2.5.0 deployment"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Affected Service *
              </label>
              <input
                type="text"
                required
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Severity *
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Environment *
              </label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="Canary">Canary</option>
                <option value="Dev">Dev</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Version / Release *
              </label>
              <input
                type="text"
                required
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
            2. Telemetry, Signals & Symptoms
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Error Message / Exception *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 502 Bad Gateway: upstream timed out while connecting to backend"
              value={formData.error_message}
              onChange={(e) => setFormData({ ...formData, error_message: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Observed Symptoms *
            </label>
            <textarea
              rows={2}
              required
              placeholder="Describe user impact, failure rates, drop in metrics, or endpoint behaviors"
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-slate-400" />
              <span>Log Excerpts / Stack Trace</span>
            </label>
            <textarea
              rows={4}
              placeholder="Paste raw log lines, error dumps, or stack traces"
              value={formData.logs}
              onChange={(e) => setFormData({ ...formData, logs: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
            3. Context & Architecture (Optional)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Infrastructure Details
              </label>
              <input
                type="text"
                placeholder="e.g. AWS EKS 1.29, Nginx Ingress, Gunicorn Uvicorn Pods"
                value={formData.infrastructure_details}
                onChange={(e) => setFormData({ ...formData, infrastructure_details: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Recent Changes / Deploy Context
              </label>
              <input
                type="text"
                placeholder="e.g. Helm chart updated port mapping and keepalive timeouts"
                value={formData.additional_context}
                onChange={(e) => setFormData({ ...formData, additional_context: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Hindsight Bank will evaluate similarity scores against 20+ historical incidents.
          </span>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-md shadow-blue-600/30 disabled:opacity-50"
          >
            <span>{submitting ? 'Submitting & Recalling...' : 'Analyze with FAILBACK'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
