"use client";

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer } from 'lucide-react';

interface TimelinePoint {
  bucket: number;
  elapsedMs: number;
  avgGreen: number;
  avgRed: number;
}

interface StudentMetric {
  name: string;
  seatId: string;
  signalCount: number;
  responseVelocity: number;
  consistencyScore: number;
  pivotCount: number;
  avgIntensity: number;
}

interface ReportDetail {
  id: string;
  title: string;
  createdAt: string;
  endedAt: string;
  durationMs: number;
  capacity: number;
  signalCount: number;
  attendees: { name: string; seatId: string }[];
  timeline: TimelinePoint[];
  studentMetrics: StudentMetric[];
}

// --- Helpers ---
function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatElapsed(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

// --- Dual Area Chart ---
function AreaChart({ timeline }: { timeline: TimelinePoint[] }) {
  const W = 600;
  const H = 160;
  const PAD = { top: 16, right: 16, bottom: 24, left: 32 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxVal = 5;

  const toX = (i: number) => PAD.left + (i / (timeline.length - 1)) * chartW;
  const toY = (v: number) => PAD.top + (1 - v / maxVal) * chartH;

  function smoothPath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cpx = (points[i - 1].x + points[i].x) / 2;
      d += ` C ${cpx} ${points[i - 1].y} ${cpx} ${points[i].y} ${points[i].x} ${points[i].y}`;
    }
    return d;
  }

  const greenPoints = timeline.map((p, i) => ({ x: toX(i), y: toY(p.avgGreen) }));
  const redPoints   = timeline.map((p, i) => ({ x: toX(i), y: toY(p.avgRed) }));

  const greenLine = smoothPath(greenPoints);
  const redLine   = smoothPath(redPoints);
  const last = greenPoints[greenPoints.length - 1];
  const first = greenPoints[0];
  const greenArea = `${greenLine} L ${last.x} ${PAD.top + chartH} L ${first.x} ${PAD.top + chartH} Z`;
  const lastR = redPoints[redPoints.length - 1];
  const firstR = redPoints[0];
  const redArea = `${redLine} L ${lastR.x} ${PAD.top + chartH} L ${firstR.x} ${PAD.top + chartH} Z`;

  const yTicks = [0, 1, 2, 3, 4, 5];
  const xTicks = timeline.filter((_, i) => i % Math.floor(timeline.length / 5) === 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
      <defs>
        <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f87171" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f87171" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Y grid lines */}
      {yTicks.map(t => (
        <g key={t}>
          <line
            x1={PAD.left} y1={toY(t)} x2={PAD.left + chartW} y2={toY(t)}
            stroke="#f3f4f6" strokeWidth="1"
          />
          <text x={PAD.left - 6} y={toY(t) + 4} fontSize="8" textAnchor="end" fill="#9ca3af">{t}</text>
        </g>
      ))}

      {/* Areas */}
      <path d={greenArea} fill="url(#greenGrad)" />
      <path d={redArea}   fill="url(#redGrad)" />

      {/* Lines */}
      <path d={greenLine} fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
      <path d={redLine}   fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />

      {/* X axis labels */}
      {xTicks.map(p => (
        <text
          key={p.bucket}
          x={toX(p.bucket)} y={H - 4}
          fontSize="8" textAnchor="middle" fill="#9ca3af"
        >
          {formatElapsed(p.elapsedMs)}
        </text>
      ))}
    </svg>
  );
}

// --- Main Report Page ---
function ReportDetailContent() {
  const router = useRouter();
  const { roomId } = useParams<{ roomId: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`/api/reports/${roomId}`)
      .then(r => r.json())
      .then(data => { setReport(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [roomId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-abacus-bone flex items-center justify-center">
        <p className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">Loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-abacus-bone flex items-center justify-center">
        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Report not found.</p>
      </div>
    );
  }

  const filteredStudents = report.studentMetrics.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const dominantSentiment = (() => {
    const totalGreen = report.timeline.reduce((a, p) => a + p.avgGreen, 0);
    const totalRed   = report.timeline.reduce((a, p) => a + p.avgRed, 0);
    if (totalGreen > totalRed * 1.2) return { label: 'Predominantly Confident', color: 'text-green-500' };
    if (totalRed > totalGreen * 1.2) return { label: 'Predominantly Friction', color: 'text-red-400' };
    return { label: 'Mixed Engagement', color: 'text-gray-400' };
  })();

  return (
    <div className="min-h-screen bg-abacus-bone print:bg-white">

      {/* Nav — hidden on print */}
      <div className="print:hidden px-10 pt-10 flex items-center justify-between mb-10">
        <button
          onClick={() => router.push('/facilitator/reports')}
          className="flex items-center gap-2 group"
        >
          <div className="p-1.5 rounded-full border border-gray-200 bg-white group-hover:bg-gray-50 transition-all">
            <ArrowLeft size={12} className="text-gray-400" />
          </div>
          <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Back to Archive</span>
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-full text-[9px] font-mono uppercase tracking-widest hover:bg-gray-50 transition-all"
        >
          <Printer size={12} className="text-gray-400" />
          Export PDF
        </button>
      </div>

      <div className="px-10 pb-16 max-w-4xl mx-auto">

        {/* Session Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.4em] mb-2">
            Session Report — {formatDate(report.createdAt)}
          </p>
          <h1 className="text-3xl font-light text-abacus-charcoal mb-4">{report.title}</h1>
          <div className="flex gap-8">
            <div>
              <p className="text-[9px] font-mono text-gray-400 uppercase">Duration</p>
              <p className="text-sm text-abacus-charcoal mt-0.5">{formatDuration(report.durationMs)}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono text-gray-400 uppercase">Attendees</p>
              <p className="text-sm text-abacus-charcoal mt-0.5">{report.attendees.length}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono text-gray-400 uppercase">Signals Logged</p>
              <p className="text-sm text-abacus-charcoal mt-0.5">{report.signalCount}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono text-gray-400 uppercase">Sentiment</p>
              <p className={`text-sm mt-0.5 ${dominantSentiment.color}`}>{dominantSentiment.label}</p>
            </div>
          </div>
        </motion.div>

        {/* Collective Pulse Chart */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Collective Pulse</p>
              <p className="text-sm font-light text-abacus-charcoal mt-0.5">Confidence vs Friction over session timeline</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-[9px] font-mono text-gray-400 uppercase">Confidence</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[9px] font-mono text-gray-400 uppercase">Friction</span>
              </div>
            </div>
          </div>

          {report.timeline.length > 1 ? (
            <AreaChart timeline={report.timeline} />
          ) : (
            <p className="text-[9px] font-mono text-gray-300 uppercase py-8 text-center">
              Insufficient signal data to render timeline.
            </p>
          )}
        </motion.div>

        {/* Student Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">Individual Metrics</p>
              <p className="text-sm font-light text-abacus-charcoal mt-0.5">Per-student engagement diagnostics</p>
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students..."
              className="text-[10px] font-mono bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full outline-none focus:ring-1 focus:ring-gray-200 print:hidden"
            />
          </div>

          {filteredStudents.length === 0 ? (
            <p className="text-[9px] font-mono text-gray-300 uppercase py-8 text-center">No students found.</p>
          ) : (
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-5 gap-4 px-3 pb-2 border-b border-gray-50">
                {['Student', 'Velocity', 'Consistency', 'Pivots', 'Avg Sentiment'].map(h => (
                  <p key={h} className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">{h}</p>
                ))}
              </div>

              {filteredStudents.map((s, i) => (
                <motion.div
                  key={s.seatId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-5 gap-4 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-xs font-medium text-abacus-charcoal">{s.name}</p>
                    <p className="text-[8px] font-mono text-gray-300 uppercase">{s.seatId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-abacus-charcoal">{s.responseVelocity}<span className="text-[8px] text-gray-400 ml-0.5">/min</span></p>
                    <div className="w-full h-0.5 bg-gray-100 rounded mt-1.5">
                      <div className="h-full bg-abacus-charcoal rounded" style={{ width: `${Math.min(s.responseVelocity * 20, 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-abacus-charcoal">{s.consistencyScore}<span className="text-[8px] text-gray-400 ml-0.5">/ 100</span></p>
                    <div className="w-full h-0.5 bg-gray-100 rounded mt-1.5">
                      <div className="h-full bg-abacus-charcoal rounded" style={{ width: `${s.consistencyScore}%` }} />
                    </div>
                  </div>
                  <p className="text-xs text-abacus-charcoal self-center">{s.pivotCount}</p>
                  <p className={`text-xs self-center font-medium ${
                    s.avgIntensity > 0.1 ? 'text-green-500'
                    : s.avgIntensity < -0.1 ? 'text-red-400'
                    : 'text-gray-400'
                  }`}>
                    {s.avgIntensity > 0.1 ? '↑ Confident'
                     : s.avgIntensity < -0.1 ? '↓ Friction'
                     : '— Neutral'}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}

export default function ReportDetailPage() {
  return (
    <Suspense>
      <ReportDetailContent />
    </Suspense>
  );
}
