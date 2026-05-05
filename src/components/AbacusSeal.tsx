"use client";

import { motion } from 'framer-motion';

const DOTS = [
  { color: '#f3c11b', label: 'Gold' },
  { color: '#518394', label: 'Steel' },
  { color: '#d4583b', label: 'Ember' },
  { color: '#de7d02', label: 'Ochre' },
  { color: '#678e79', label: 'Moss' },
  { color: '#0887a0', label: 'Teal' },
];

interface AbacusSealProps {
  /** 0–1. Main UI uses 0.15; lobby/login/termination uses 1 */
  opacity?: number;
  /** Diameter of each dot in px */
  dotSize?: number;
  /** Gap between dots in px */
  gap?: number;
  animate?: boolean;
}

export default function AbacusSeal({
  opacity = 1,
  dotSize = 10,
  gap = 6,
  animate = false,
}: AbacusSealProps) {
  return (
    <div
      style={{ opacity, gap }}
      className="flex items-center"
      aria-hidden="true"
    >
      {DOTS.map((dot, i) => (
        <motion.div
          key={dot.label}
          initial={animate ? { scale: 0, opacity: 0 } : false}
          animate={animate ? { scale: 1, opacity: 1 } : undefined}
          transition={animate ? { delay: i * 0.06, type: 'spring', stiffness: 300, damping: 20 } : undefined}
          style={{
            width:  dotSize,
            height: dotSize,
            backgroundColor: dot.color,
            borderRadius: '50%',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}
