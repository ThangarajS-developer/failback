'use client';

import React, { useState } from 'react';
import {
  X,
  MessageSquareCode,
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { CopilotResponse } from '@/lib/types';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  hasHistoricalEvidence?: boolean;
  sources?: string[];
  suggestedQuestions?: string[];
}

export default function CopilotDrawer({ isOpen, onClose, incidentId }: CopilotDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I am FAILBACK's SRE Copilot. I analyze production incidents by cross-referencing your live problem against the Hindsight persistent memory bank. What would you like to investigate?",
      hasHistoricalEvidence: true,
      suggestedQuestions: [
        'What fixes failed in similar incidents?',
        'Have we seen this 502 error pattern before?',
        'Why are you recommending this specific fix?',
        'What is different between this incident and prior occurrences?',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.queryCopilot(query, incidentId);
      const assistantMsg: Message = {
        role: 'assistant',
        content: res.answer,
        hasHistoricalEvidence: res.has_historical_evidence,
        sources: res.sources,
        suggestedQuestions: res.suggested_questions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error retrieving memory from Hindsight: ${err.message || 'Network error'}`,
          hasHistoricalEvidence: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <MessageSquareCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Grounded Incident Copilot</h3>
            <p className="text-xs text-slate-400 font-mono">
              {incidentId ? `Scoped to ${incidentId}` : 'Memory-Wide Investigation'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Safety Notice */}
      <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>Grounded strictly in historical Hindsight memories. Advisory only.</span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-lg p-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>

              {/* Source badges */}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-mono">Hindsight Sources:</span>
                  {m.sources.map((src) => (
                    <span
                      key={src}
                      className="px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/30 text-blue-300 font-mono text-[11px]"
                    >
                      #{src}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Suggested Followups */}
            {m.suggestedQuestions && m.suggestedQuestions.length > 0 && (
              <div className="mt-2 space-y-1 w-full max-w-[90%]">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Suggested Questions:
                </span>
                {m.suggestedQuestions.map((q, qIdx) => (
                  <button
                    key={qIdx}
                    onClick={() => handleSend(q)}
                    className="w-full text-left text-xs px-2.5 py-1.5 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-cyan-300 hover:text-cyan-200 transition truncate block"
                  >
                    👉 {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono py-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Recalling historical memories from Hindsight...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about failed fixes, root causes, similar incidents..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
