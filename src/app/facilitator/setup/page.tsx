"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Room {
  id: string;
  title: string;
  capacity: number;
  attendees: { id: string }[];
}

export default function FacilitatorLobby() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [capacity, setCapacity] = useState(20);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/rooms');
        if (res.ok) setRooms(await res.json());
      } catch (e) { console.error("Failed to fetch rooms", e); }
    };
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
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
  };

  return (
    <div className="min-h-screen bg-abacus-bone p-10 font-sans text-abacus-charcoal">
      <header className="mb-16">
        <h1 className="text-[10px] font-mono tracking-[0.4em] text-gray-400 uppercase">Facilitator Hub</h1>
        <p className="text-2xl font-light mt-2">Classroom Overview</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">

        {/* CREATE SECTION */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium uppercase tracking-widest text-gray-400 mb-6">Initiate</h3>
            <AnimatePresence mode="wait">
              {!isCreating ? (
                <motion.p
                  key="cta"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-lg font-light mb-8"
                >
                  Ready to host a new session? Set your parameters and go live.
                </motion.p>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-5 mb-8"
                >
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 uppercase">Classroom Name</label>
                    <input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                      placeholder="e.g. OCAD Thesis 2026"
                      autoFocus
                      className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl mt-2 focus:ring-1 focus:ring-abacus-charcoal outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 uppercase">
                      Capacity — {capacity} Students
                    </label>
                    <input
                      type="range" min={5} max={50} value={capacity}
                      onChange={e => setCapacity(parseInt(e.target.value))}
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-4 accent-abacus-charcoal"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-3">
            {isCreating && (
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 border border-gray-200 text-gray-400 py-4 rounded-xl text-xs font-mono uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            )}
            <button
              onClick={isCreating ? handleCreate : () => setIsCreating(true)}
              disabled={isCreating && !title.trim()}
              className="flex-1 bg-abacus-charcoal text-white py-4 rounded-xl text-xs font-mono uppercase tracking-widest hover:bg-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Go Live' : 'Create New Class'}
            </button>
          </div>
        </div>

        {/* LIVE SESSIONS SECTION */}
        <div className="bg-white/50 p-8 rounded-[2rem] border border-dashed border-gray-300 flex flex-col">
          <h3 className="text-sm font-medium uppercase tracking-widest text-gray-400 mb-6">Live Now</h3>

          {rooms.length === 0 ? (
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-2">
              No active sessions
            </p>
          ) : (
            <div className="space-y-4">
              {rooms.map(room => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium">{room.title}</p>
                    <p className="text-[9px] font-mono text-green-500 uppercase mt-0.5">
                      Active &bull; {room.attendees.length} Student{room.attendees.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/mirror/${room.id}`)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-[9px] font-mono uppercase hover:bg-gray-50 transition-all"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
