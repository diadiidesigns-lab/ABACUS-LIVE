"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import AbacusSeal from '@/components/AbacusSeal';
import IntroAnimation from '@/components/IntroAnimation';

type PortalRole = 'STUDENT' | 'TEACHER';

function EntryPortal() {
  const router = useRouter();
  const [role, setRole] = useState<PortalRole>('STUDENT');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');

  const handleEntry = () => {
    if (!name.trim() && role === 'STUDENT') {
      alert("Please enter your name to join the conversation.");
      return;
    }

    if (role === 'TEACHER') {
      if (pin === '1234') {
        router.push(`/facilitator/lobby`);
      } else {
        alert("Invalid PIN");
      }
    } else {
      router.push(`/lobby?name=${encodeURIComponent(name)}`);
    }
  };

  return (
    <div className="min-h-screen bg-abacus-bone flex flex-col items-center justify-center p-6 text-abacus-charcoal">

      {/* Brand Identity */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="mb-12 text-center flex flex-col items-center"
      >
        <AbacusSeal opacity={1} dotSize={12} gap={7} animate />
        <h1
          className="mt-4 text-4xl tracking-[0.15em] text-abacus-charcoal mb-2"
          style={{ fontFamily: 'var(--font-logotype)', fontWeight: 700 }}
        >
          ABACUS
        </h1>
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-400">
          Learning made accountable
        </p>
      </motion.div>

      {/* Portal Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        className="flex bg-gray-100 p-1 rounded-full mb-12 w-64 border border-gray-200"
      >
        {(['STUDENT', 'TEACHER'] as PortalRole[]).map((r) => (
          <button
            key={r}
            onClick={() => {
              setRole(r);
              setName('');
              setPin('');
            }}
            className={`flex-1 py-2 text-[10px] font-mono tracking-widest rounded-full transition-all ${
              role === r
                ? 'bg-white shadow-sm text-abacus-charcoal font-bold'
                : 'text-gray-400'
            }`}
          >
            {r}
          </button>
        ))}
      </motion.div>

      {/* Dynamic Portal Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={role}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="w-full max-w-xs text-center"
        >
          <h2 className="text-xl font-light mb-2">
            {role === 'TEACHER' ? 'Create, host and read the room' : 'Join the conversation'}
          </h2>
          <p className="text-[10px] font-mono text-gray-400 uppercase mb-8">
            {role === 'TEACHER' ? 'Secure Facilitator Access' : 'Participant Entry'}
          </p>

          <div className="space-y-4">
            <input
              type="text"
              placeholder={role === 'TEACHER' ? 'Facilitator Name' : 'Enter your name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleEntry(); }}
              className="w-full bg-white border border-gray-200 p-4 rounded-xl focus:ring-1 focus:ring-abacus-charcoal outline-none transition-all"
            />

            {role === 'TEACHER' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <input
                  type="password"
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleEntry(); }}
                  className="w-full bg-white border border-gray-200 p-4 rounded-xl focus:ring-1 focus:ring-abacus-charcoal outline-none transition-all"
                />
              </motion.div>
            )}

            {role === 'STUDENT' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-200" />
                  <span className="flex-shrink-0 mx-4 text-[9px] font-mono text-gray-300">OR</span>
                  <div className="flex-grow border-t border-gray-200" />
                </div>
                <button className="w-full bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors shadow-sm">
                  <span className="text-sm font-medium">Continue with Google</span>
                </button>
              </motion.div>
            )}

            <button
              onClick={handleEntry}
              disabled={role === 'STUDENT' && !name.trim()}
              className="w-full bg-abacus-charcoal text-white p-4 rounded-xl text-sm font-medium hover:bg-black transition-all mt-4 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {role === 'TEACHER' ? 'Launch Workspace' : 'Enter Lobby'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {!introDone ? (
        <IntroAnimation key="intro" onComplete={() => setIntroDone(true)} />
      ) : (
        <motion.div
          key="portal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <EntryPortal />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
