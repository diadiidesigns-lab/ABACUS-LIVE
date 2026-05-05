"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft, Power } from 'lucide-react';

interface FacilitatorControlsProps {
  roomId: string;
  roomTitle: string;
}

export default function FacilitatorControls({ roomId, roomTitle }: FacilitatorControlsProps) {
  const router = useRouter();

  const handleTerminate = async () => {
    const confirmed = window.confirm("Terminate Class? All students will be escorted out.");
    if (!confirmed) return;
    try {
      await fetch(`/api/rooms/${roomId}/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLive: false }),
      });
      router.push('/facilitator/lobby');
    } catch (error) {
      console.error("Termination failed", error);
    }
  };

  return (
    <nav className="w-full flex items-center justify-between px-8 py-6 bg-abacus-bone/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">

      {/* Back to Overview */}
      <button
        onClick={() => router.push('/facilitator/lobby')}
        className="flex items-center gap-3 group"
      >
        <div className="p-2 rounded-full border border-gray-200 bg-white group-hover:bg-gray-50 transition-all">
          <ArrowLeft size={14} className="text-gray-400" />
        </div>
        <div className="text-left">
          <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest leading-none">Navigate</p>
          <p className="text-xs font-medium text-abacus-charcoal">Back to Overview</p>
        </div>
      </button>

      {/* Session Info */}
      <div className="hidden md:flex flex-col items-center">
        <h2 className="text-[10px] font-mono tracking-[0.3em] text-gray-400 uppercase">{roomTitle}</h2>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-mono text-green-600 uppercase tracking-widest">Live Signal Active</span>
        </div>
      </div>

      {/* Terminate */}
      <button
        onClick={handleTerminate}
        className="flex items-center gap-3 group text-right"
      >
        <div className="hidden sm:block">
          <p className="text-[9px] font-mono text-red-300 uppercase tracking-widest leading-none">System</p>
          <p className="text-xs font-medium text-red-500">Terminate Lesson</p>
        </div>
        <div className="p-2 rounded-full border border-red-100 bg-red-50 group-hover:bg-red-100 transition-all">
          <Power size={14} className="text-red-500" />
        </div>
      </button>

    </nav>
  );
}
