"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ExternalLink, Plus, Archive } from 'lucide-react';

interface Room {
  id: string;
  title: string;
  capacity: number;
  isLive: boolean;
  attendees: { id: string }[];
}

export default function FacilitatorLobby() {
  const router = useRouter();
  const [liveRooms, setLiveRooms] = useState<Room[]>([]);

  // Create form state
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [capacity, setCapacity] = useState(20);
  const [isLaunching, setIsLaunching] = useState(false);

  // 1. SYNC LOGIC
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/rooms');
        if (!res.ok) return;
        const data: Room[] = await res.json();
        setLiveRooms(data.filter(r => r.isLive === true));
      } catch (e) {
        console.error("Lobby sync failed", e);
      }
    };
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. CREATE LOGIC
  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsLaunching(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, capacity }),
      });
      if (res.ok) {
        const room = await res.json();
        router.push(`/mirror/${room.id}`);
      } else {
        alert("Could not go live. Check terminal for database errors.");
      }
    } finally {
      setIsLaunching(false);
    }
  };

  // 3. QUICK DELETE LOGIC
  const handleQuickDelete = async (roomId: string) => {
    const confirmed = window.confirm("End this session? Students will be escorted out and the room will be removed from Live Now.");
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}/terminate`, { method: 'PATCH' });
      if (!res.ok) throw new Error(`Terminate failed: ${res.status}`);
      // Only remove from UI once the DB confirms the update
      setLiveRooms(prev => prev.filter(room => room.id !== roomId));
    } catch (error) {
      console.error("Failed to terminate room", error);
      alert("Could not end the session. Please try again.");
    }
  };

  return (
    <div className="p-10 bg-abacus-bone min-h-screen">
      <header className="mb-12 flex items-start justify-between">
        <h1 className="text-[10px] font-mono tracking-[0.4em] text-gray-400 uppercase">Classroom Overview</h1>
        <button
          onClick={() => router.push('/facilitator/reports')}
          className="flex items-center gap-2 text-[9px] font-mono text-gray-400 uppercase tracking-widest hover:text-abacus-charcoal transition-colors"
        >
          <Archive size={12} />
          Archive
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* CREATE NEW CLASS — pinned first */}
        <motion.div
          layout
          className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between min-h-[160px]"
        >
          <AnimatePresence mode="wait">
            {!isCreating ? (
              <motion.div
                key="cta"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col justify-between h-full"
              >
                <div>
                  <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mb-2">Initiate</p>
                  <p className="text-sm font-light text-abacus-charcoal">Ready to host a new session?</p>
                </div>
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-abacus-charcoal text-white rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-black transition-all"
                >
                  <Plus size={12} /> Create New Class
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="text-[9px] font-mono text-gray-400 uppercase">Classroom Name</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                    placeholder="e.g. OCAD Thesis 2026"
                    autoFocus
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl mt-1.5 focus:ring-1 focus:ring-abacus-charcoal outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-gray-400 uppercase">
                    Capacity — {capacity} Students
                  </label>
                  <input
                    type="range" min={5} max={50} value={capacity}
                    onChange={e => setCapacity(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2 accent-abacus-charcoal"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setIsCreating(false); setTitle(''); setCapacity(20); }}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-400 rounded-xl text-[9px] font-mono uppercase tracking-widest hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!title.trim() || isLaunching}
                    className="flex-1 py-2.5 bg-abacus-charcoal text-white rounded-xl text-[9px] font-mono uppercase tracking-widest hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isLaunching ? 'Launching...' : 'Go Live'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* EMPTY STATE */}
        {liveRooms.length === 0 && (
          <div className="flex items-center justify-center rounded-[2rem] border border-dashed border-gray-200 min-h-[160px]">
            <p className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">
              No active sessions
            </p>
          </div>
        )}

        {/* LIVE ROOM CARDS */}
        <AnimatePresence>
          {liveRooms.map(room => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-sm font-medium text-abacus-charcoal">{room.title}</h3>
                  <p className="text-[9px] font-mono text-green-500 uppercase tracking-widest mt-1">
                    Live &bull; {room.attendees?.length ?? 0} Active
                  </p>
                </div>
                <button
                  onClick={() => handleQuickDelete(room.id)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  title="Terminate Session"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <button
                onClick={() => router.push(`/mirror/${room.id}`)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-mono uppercase tracking-widest hover:bg-white hover:border-gray-200 transition-all"
              >
                Join as Facilitator <ExternalLink size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

      </div>
    </div>
  );
}
