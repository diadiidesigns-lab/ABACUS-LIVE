"use client";

import { useState, useEffect } from 'react';
import FacilitatorSeat from '@/components/FacilitatorSeat';
import FacilitatorControls from '@/components/FacilitatorControls';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';

interface Room {
  id: string;
  title: string;
  capacity: number;
}

interface Signal {
  seatId: string;
  studentName: string;
  intensity: number;
  greenBeads: number;
  redBeads: number;
  timestamp: string;
}

interface Attendee {
  name: string;
  seatId: string;
}

// Mirrors the seatId generation in assignSeat (intelligence.ts)
function generateSeatIds(capacity: number): string[] {
  const rows = 'ABCDEFGHIJ';
  const cols = Math.ceil(capacity / rows.length);
  const seats: string[] = [];
  for (let r = 0; r < rows.length && seats.length < capacity; r++) {
    for (let c = 1; c <= cols && seats.length < capacity; c++) {
      seats.push(`${rows[r]}${c}`);
    }
  }
  return seats;
}

function getGridCols(capacity: number): string {
  if (capacity <= 6) return 'grid-cols-2 sm:grid-cols-3';
  if (capacity <= 16) return 'grid-cols-4';
  return 'grid-cols-5 md:grid-cols-8';
}

export default function MirrorDashboard({ roomId }: { roomId: string }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [roster, setRoster] = useState<Record<string, string>>({});
  const [signals, setSignals] = useState<Record<string, Signal>>({});
  const [seatSlots, setSeatSlots] = useState<(string | null)[]>([null, null, null, null, null]);

  // Fetch room metadata (title + capacity)
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch('/api/rooms');
        const rooms: Room[] = await res.json();
        const found = rooms.find(r => r.id === roomId);
        if (found) setRoom(found);
      } catch (e) { console.error("Room fetch error", e); }
    };
    fetchRoom();
  }, [roomId]);

  // Prisma roster as the reliable source of truth for student names
  useEffect(() => {
    if (!roomId) return;
    const fetchRoster = async () => {
      try {
        const res = await fetch(`/api/roster?roomId=${roomId}`);
        const data: Attendee[] = await res.json();
        const map: Record<string, string> = {};
        data.forEach(a => { map[a.seatId] = a.name; });
        setRoster(map);
      } catch (e) { console.error("Roster error", e); }
    };
    fetchRoster();
    const interval = setInterval(fetchRoster, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  // Real-time presence overlay for instant departure detection (graceful — won't break if Firestore is unavailable)
  useEffect(() => {
    if (!roomId || !db) return;
    let unsubActive: (() => void) | undefined;
    let unsubLobby: (() => void) | undefined;

    try {
      const presenceRef = collection(db, 'rooms', roomId, 'presence');

      // Listen for departures → remove from roster instantly
      unsubLobby = onSnapshot(
        query(presenceRef, where('status', '==', 'lobby')),
        (snapshot) => {
          const departed = new Set<string>();
          snapshot.forEach((d) => {
            const data = d.data();
            if (data.seatId) departed.add(data.seatId);
          });
          if (departed.size > 0) {
            setRoster(prev => {
              const updated = { ...prev };
              departed.forEach(seatId => delete updated[seatId]);
              return updated;
            });
          }
        },
        () => {} // Silently ignore Firestore errors — Prisma polling is the fallback
      );

      // Listen for arrivals → add to roster instantly
      unsubActive = onSnapshot(
        query(presenceRef, where('status', '==', 'active')),
        (snapshot) => {
          setRoster(prev => {
            const updated = { ...prev };
            snapshot.forEach((d) => {
              const data = d.data();
              if (data.seatId && data.name) {
                updated[data.seatId] = data.name;
              }
            });
            return updated;
          });
        },
        () => {} // Silently ignore Firestore errors
      );
    } catch (e) {
      console.warn("Firestore presence unavailable, using polling only");
    }

    return () => {
      unsubActive?.();
      unsubLobby?.();
    };
  }, [roomId]);

  // Real-time FCFS seat slots listener (graceful)
  useEffect(() => {
    if (!roomId || !db) return;
    let unsubscribe: (() => void) | undefined;
    try {
      const seatsRef = doc(db, 'rooms', roomId, 'meta', 'seats');
      unsubscribe = onSnapshot(seatsRef, (snap) => {
        if (snap.exists()) {
          setSeatSlots(snap.data().slots);
        }
      }, () => {});
    } catch (e) {
      console.warn("Firestore seat slots unavailable");
    }
    return () => unsubscribe?.();
  }, [roomId]);

  // Fetch signals
  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch(`/api/signals?roomId=${roomId}`);
        const data: Signal[] = await res.json();
        const map: Record<string, Signal> = {};
        data.forEach(s => { map[s.seatId] = s; });
        setSignals(map);
      } catch (e) { console.error("Signal error", e); }
    };
    const interval = setInterval(fetchSignals, 2000);
    return () => clearInterval(interval);
  }, [roomId]);

  const seatIds = room ? generateSeatIds(room.capacity) : [];

  return (
    <div className="min-h-screen bg-abacus-bone">
      <FacilitatorControls roomId={roomId} roomTitle={room?.title ?? ''} />

      <div className="p-10">
        <header className="mb-12">
          <h2 className="text-[10px] font-mono tracking-widest text-gray-400 uppercase">
            Live Map: {room?.title ?? 'Loading...'}
          </h2>
          {room && (
            <p className="text-sm text-gray-400 font-mono mt-1">{room.capacity} Seats Total</p>
          )}
        </header>

        {/* FCFS Seat Slots — real-time 5-slot presence bar */}
        <div className="mb-10">
          <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mb-4">Active Students</p>
          <div className="flex gap-3">
            {seatSlots.map((name, i) => (
              <div
                key={i}
                className={`flex-1 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 ${
                  name
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-dashed border-gray-200'
                }`}
              >
                {name ? (
                  <span className="text-xs font-medium text-abacus-charcoal truncate px-2">{name}</span>
                ) : (
                  <span className="text-[9px] font-mono text-gray-300 uppercase">Slot {i + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={`grid gap-6 ${room ? getGridCols(room.capacity) : ''}`}>
          {seatIds.map(seatId => (
            <FacilitatorSeat
              key={seatId}
              seatId={seatId}
              studentName={roster[seatId] ?? signals[seatId]?.studentName}
              greenBeads={signals[seatId]?.greenBeads ?? 0}
              redBeads={signals[seatId]?.redBeads ?? 0}
              timestamp={signals[seatId]?.timestamp}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
