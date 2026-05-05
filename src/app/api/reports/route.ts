import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Bucket signals into N slots and return avg intensity per slot
function computeSparkline(
  signals: { intensity: number; timestamp: Date }[],
  start: Date,
  end: Date,
  buckets = 20
): number[] {
  const duration = end.getTime() - start.getTime();
  if (duration <= 0 || signals.length === 0) return new Array(buckets).fill(0);

  const sums = new Array(buckets).fill(0);
  const counts = new Array(buckets).fill(0);

  for (const sig of signals) {
    const elapsed = new Date(sig.timestamp).getTime() - start.getTime();
    const bucket = Math.min(Math.floor((elapsed / duration) * buckets), buckets - 1);
    sums[bucket] += sig.intensity;
    counts[bucket]++;
  }

  const raw = sums.map((s, i) => (counts[i] > 0 ? s / counts[i] : 0));

  // 3-point moving average for smooth "flowing ink" look
  return raw.map((v, i) => {
    const prev = raw[i - 1] ?? v;
    const next = raw[i + 1] ?? v;
    return (prev + v + next) / 3;
  });
}

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: { isLive: false },
      include: {
        attendees: true,
        signals: { orderBy: { timestamp: 'asc' }, select: { intensity: true, timestamp: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sessions = rooms.map(room => {
      // Use last signal time as session end, falling back to createdAt + 1 hour
      const lastSignalTime = room.signals.length > 0
        ? new Date(room.signals[room.signals.length - 1].timestamp)
        : null;
      const end = lastSignalTime ?? new Date(room.createdAt.getTime() + 3600_000);
      const durationMs = end.getTime() - room.createdAt.getTime();
      const totalIntensity = room.signals.reduce((sum, s) => sum + s.intensity, 0);

      return {
        id: room.id,
        title: room.title,
        createdAt: room.createdAt,
        endedAt: end.toISOString(),
        durationMs,
        attendeeCount: room.attendees.length,
        signalCount: room.signals.length,
        avgIntensity: room.signals.length > 0 ? totalIntensity / room.signals.length : 0,
        sparkline: computeSparkline(room.signals, room.createdAt, end),
      };
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Reports list error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
