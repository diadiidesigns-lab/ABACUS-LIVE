"use client";

import { motion } from 'framer-motion';

const STALE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

interface SeatProps {
  seatId: string;
  studentName?: string;
  greenBeads: number;
  redBeads: number;
  timestamp?: string;
}

export default function FacilitatorSeat({ seatId, studentName, greenBeads, redBeads, timestamp }: SeatProps) {
  const isStale = timestamp
    ? Date.now() - new Date(timestamp).getTime() > STALE_THRESHOLD_MS
    : false;

  // Fade to neutral if signal is older than 3 minutes
  const activeGreen = isStale ? 0 : greenBeads;
  const activeRed   = isStale ? 0 : redBeads;

  const greenIntensity = activeGreen / 5;
  const redIntensity   = activeRed / 5;

  const tooltipText = isStale
    ? 'Signal stale'
    : activeRed > 0 ? `${activeRed} Friction Beads`
    : activeGreen > 0 ? `${activeGreen} Confidence Beads`
    : 'Neutral';

  return (
    <div className="relative group">
      <motion.div
        animate={{
          backgroundColor:
            activeGreen > 0 ? `rgba(74, 222, 128, ${greenIntensity})` :
            activeRed > 0   ? `rgba(248, 113, 113, ${redIntensity})` :
            'rgba(255, 255, 255, 1)',
          borderColor:
            activeGreen > 0 ? '#22c55e' :
            activeRed > 0   ? '#ef4444' :
            '#e5e7eb',
          opacity: isStale ? 0.45 : 1,
        }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="w-32 h-32 rounded-3xl border-2 shadow-sm flex flex-col items-center justify-center p-4 text-center hover:shadow-md bg-white"
      >
        <span className="absolute top-3 left-4 text-[9px] font-mono text-gray-400 uppercase tracking-widest">
          {seatId}
        </span>

        <p className="text-sm font-medium text-abacus-charcoal truncate w-full">
          {studentName || "Empty Seat"}
        </p>

        <div className="mt-3 flex gap-1">
          {activeGreen > 0 && [...Array(activeGreen)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-600/50" />
          ))}
          {activeRed > 0 && [...Array(activeRed)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-red-600/50" />
          ))}
          {isStale && timestamp && (
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          )}
        </div>
      </motion.div>

      {/* Hover tooltip */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <div className="bg-abacus-charcoal text-white text-[10px] py-1 px-3 rounded-full whitespace-nowrap font-mono uppercase tracking-tighter">
          {tooltipText}
        </div>
      </div>
    </div>
  );
}
