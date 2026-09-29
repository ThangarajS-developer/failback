'use client';

import React, { useState } from 'react';
import { X, CheckCircle, XCircle, BrainCircuit, Clock, FileText } from 'lucide-react';
import { api } from '@/lib/api';

interface ResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string;
  mode: 'RESOLVE' | 'FAIL';
  onSuccess: () => void;
}

export default function ResolutionModal({
  isOpen,
  onClose,
  incidentId,
  mode,
  onSuccess,
}: ResolutionModalProps) {
  // Fields for Mark Resolved
  const [resolutionUsed, setResolutionUsed] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [notes, setNotes] = useState('');
  const [timeToResolution, setTimeToResolution] = useState(15);

  // Fields for Mark Failed
  const [attemptedAction, setAttemptedAction] = useState('');
  const [whyItFailed, setWhyItFailed] = useState('');
  const [observedResult, setObservedResult] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (mode === 'RESOLVE') {
        if (!resolutionUsed.trim() || !rootCause.trim()) {
          setError('Please provide both the resolution used and confirmed root cause.');
          setSubmitting(false);
          return;
        }
        await api.resolveIncident(incidentId, {
          resolution_used: resolutionUsed,
          root_cause: rootCause,
          notes,
          time_to_resolution_minutes: Number(timeToResolution),
        });
      } else {
        if (!attemptedAction.trim() || !whyItFailed.trim()) {
          setError('Please specify what action was attempted and why it failed.');
          setSubmitting(false);
          return;
        }
        await api.recordFailure(incidentId, {
          attempted_action: attemptedAction,
          why_it_failed: whyItFailed,
          observed_result: observedResult,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            {mode === 'RESOLVE' ? (
              <div className="p-1.5 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
            ) : (
              <div className="p-1.5 rounded-md bg-red-950 border border-red-500/40 text-red-400">
                <XCircle className="h-5 w-5" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-100">
                {mode === 'RESOLVE' ? 'Mark Incident as Resolved' : 'Record Failed Troubleshooting Attempt'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Stores experience into Hindsight memory for #{incidentId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-950/80 border border-red-500/40 text-red-200 text-xs">
              {error}
            </div>
          )}

          {mode === 'RESOLVE' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Resolution Used (What fixed it?) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corrected upstream targetPort in Ingress ConfigMap"
                  value={resolutionUsed}
                  onChange={(e) => setResolutionUsed(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Confirmed Root Cause *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ingress routed to port 8080 instead of container listener port 8000"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    Time to Resolution (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={timeToResolution}
                    onChange={(e) => setTimeToResolution(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-slate-400" />
                  Engineer Feedback & Lessons Learned
                </label>
                <textarea
                  rows={3}
                  placeholder="What was misleading? What helped pinpoint the problem? What should be checked first next time?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Attempted Action (What was tried?) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Restarted API service pods"
                  value={attemptedAction}
                  onChange={(e) => setAttemptedAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Why It Failed (Why didn&apos;t it resolve the issue?) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Pods restarted in 40s but 502 errors persisted at identical 40% rate; upstream connection refused was unchanged."
                  value={whyItFailed}
                  onChange={(e) => setWhyItFailed(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Observed Result / Impact
                </label>
                <input
                  type="text"
                  placeholder="e.g. Added 30s of unnecessary pod termination overhead with zero error rate change."
                  value={observedResult}
                  onChange={(e) => setObservedResult(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </>
          )}

          {/* Retention Notice */}
          <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-500/30 flex items-start gap-2.5 text-xs text-blue-300">
            <BrainCircuit className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
            <div>
              <strong className="text-white block font-medium">Hindsight Active Retention</strong>
              This troubleshooting outcome will be structured and committed to Hindsight bank
              so future incident responders are warned about this experience.
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 rounded-md text-white text-sm font-medium transition shadow-sm ${
                mode === 'RESOLVE'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-red-600 hover:bg-red-500'
              } disabled:opacity-50`}
            >
              {submitting ? 'Retaining to Hindsight...' : mode === 'RESOLVE' ? 'Commit Resolution & Retain' : 'Save Failed Attempt & Retain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
