"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface SessionSummary {
  id: string;
  title: string;
  createdAt: string;
  endedAt: string;
  durationMs: number;
  attendeeCount: number;
  signalCount: number;
  avgIntensity: number;
  sparkline: number[];
}

// --- Sparkline SVG ---
function Sparkline({ data, width = 120, height = 32 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return <div style={{ width, height }} className="bg-gray-50 rounded" />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 0.01;
  const pad = 2;

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + (1 - (v - min) / range) * (height - pad * 2),
  }));

  // Smooth cubic bezier path
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cpx = (points[i - 1].x + points[i].x) / 2;
    linePath += ` C ${cpx} ${points[i - 1].y} ${cpx} ${points[i].y} ${points[i].x} ${points[i].y}`;
  }

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const avgIntensity = data.reduce((a, b) => a + b, 0) / data.length;
  const isPositive = avgIntensity >= 0;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${isPositive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isPositive ? '#4ade80' : '#f87171'} stopOpacity="0.3" />
          <stop offset="100%" stopColor={isPositive ? '#4ade80' : '#f87171'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${isPositive})`} />
      <path d={linePath} fill="none" stroke={isPositive ? '#4ade80' : '#f87171'} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// --- Main Page ---
export default function ReportsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SessionSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then(data => { setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reports/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== deleteTarget.id));
      } else {
        alert('Failed to delete session. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-abacus-bone p-10 print:p-0">

      {/* Header */}
      <div className="mb-12 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/facilitator/lobby')}
            className="flex items-center gap-2 group mb-4"
          >
            <div className="p-1.5 rounded-full border border-gray-200 bg-white group-hover:bg-gray-50 transition-all">
              <ArrowLeft size={12} className="text-gray-400" />
            </div>
            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Back to Hub</span>
          </button>
          <h1 className="text-[10px] font-mono tracking-[0.4em] text-gray-400 uppercase">Post-Session Archive</h1>
          <p className="text-2xl font-light text-abacus-charcoal mt-1">Accountable Reports</p>
        </div>
        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
          {sessions.length} Session{sessions.length !== 1 ? 's' : ''} Archived
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">Loading archive...</p>
      ) : sessions.length === 0 ? (
        <div className="flex items-center justify-center h-64 border border-dashed border-gray-200 rounded-[2rem]">
          <p className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">
            No sessions archived yet. Terminate a live class to generate a report.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {sessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => router.push(`/facilitator/reports/${session.id}`)}
                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
              >
                {/* Top row */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium text-abacus-charcoal">{session.title}</p>
                    <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">
                      {formatDate(session.endedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-widest ${
                      session.avgIntensity > 0.1
                        ? 'bg-green-50 text-green-600'
                        : session.avgIntensity < -0.1
                        ? 'bg-red-50 text-red-400'
                        : 'bg-gray-50 text-gray-400'
                    }`}>
                      {session.avgIntensity > 0.1 ? 'Confident' : session.avgIntensity < -0.1 ? 'Friction' : 'Neutral'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(session); }}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                      title="Delete session"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Sparkline */}
                <div className="my-4">
                  <Sparkline data={session.sparkline} width={240} height={40} />
                </div>

                {/* Footer stats */}
                <div className="flex gap-6 pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[9px] font-mono text-gray-400 uppercase">Students</p>
                    <p className="text-sm font-medium text-abacus-charcoal mt-0.5">{session.attendeeCount}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-gray-400 uppercase">Signals</p>
                    <p className="text-sm font-medium text-abacus-charcoal mt-0.5">{session.signalCount}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-gray-400 uppercase">Duration</p>
                    <p className="text-sm font-medium text-abacus-charcoal mt-0.5">{formatDuration(session.durationMs)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-red-50">
                  <Trash2 size={16} className="text-red-500" />
                </div>
                <h3 className="text-sm font-medium text-abacus-charcoal">Confirm Delete</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-2">
                You are about to permanently delete the session:
              </p>
              <p className="text-sm font-medium text-abacus-charcoal mb-1">{deleteTarget.title}</p>
              <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mb-6">
                {deleteTarget.attendeeCount} students &bull; {deleteTarget.signalCount} signals
              </p>
              <p className="text-[10px] text-red-400 mb-6">
                This will remove all student response data and analytics for this session. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
