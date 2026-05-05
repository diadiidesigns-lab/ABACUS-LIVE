import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function movingAverage(data: number[], window = 3): number[] {
  return data.map((_, i) => {
    const slice = data.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        attendees: true,
        signals: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!room) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const sessionStart = room.createdAt;
    const lastSignal = room.signals.length > 0
      ? new Date(room.signals[room.signals.length - 1].timestamp)
      : null;
    const sessionEnd = lastSignal ?? new Date(sessionStart.getTime() + 3600_000);
    const durationMs = sessionEnd.getTime() - sessionStart.getTime();
    const BUCKETS = 40;

    // --- Timeline: avgGreen and avgRed per time bucket ---
    const greenSums = new Array(BUCKETS).fill(0);
    const redSums   = new Array(BUCKETS).fill(0);
    const counts    = new Array(BUCKETS).fill(0);

    for (const sig of room.signals) {
      const elapsed = new Date(sig.timestamp).getTime() - sessionStart.getTime();
      const bucket  = durationMs > 0
        ? Math.min(Math.floor((elapsed / durationMs) * BUCKETS), BUCKETS - 1)
        : 0;
      greenSums[bucket] += sig.greenBeads;
      redSums[bucket]   += sig.redBeads;
      counts[bucket]++;
    }

    const rawGreen = greenSums.map((s, i) => counts[i] > 0 ? s / counts[i] : 0);
    const rawRed   = redSums.map((s, i)   => counts[i] > 0 ? s / counts[i] : 0);

    const timeline = movingAverage(rawGreen).map((green, i) => ({
      bucket: i,
      elapsedMs: Math.round((i / BUCKETS) * durationMs),
      avgGreen: +green.toFixed(2),
      avgRed:   +movingAverage(rawRed)[i].toFixed(2),
    }));

    // --- Per-student metrics ---
    const studentMetrics = room.attendees.map(attendee => {
      const sigs = room.signals.filter(s => s.seatId === attendee.seatId);
      const intensities = sigs.map(s => s.intensity);

      // Pivot points: sign changes in consecutive signals
      let pivots = 0;
      for (let i = 1; i < intensities.length; i++) {
        if (
          (intensities[i - 1] < 0 && intensities[i] > 0) ||
          (intensities[i - 1] > 0 && intensities[i] < 0)
        ) pivots++;
      }

      const durationMin = durationMs / 60000 || 1;
      const consistency = Math.max(0, Math.round((1 - stdDev(intensities)) * 100));

      return {
        name: attendee.name,
        seatId: attendee.seatId,
        signalCount: sigs.length,
        responseVelocity: +(sigs.length / durationMin).toFixed(2),
        consistencyScore: consistency,
        pivotCount: pivots,
        avgIntensity: intensities.length > 0
          ? +(intensities.reduce((a, b) => a + b, 0) / intensities.length).toFixed(2)
          : 0,
      };
    });

    return NextResponse.json({
      id: room.id,
      title: room.title,
      createdAt: room.createdAt,
      endedAt: sessionEnd,
      durationMs,
      capacity: room.capacity,
      attendees: room.attendees,
      signalCount: room.signals.length,
      timeline,
      studentMetrics,
    });
  } catch (error) {
    console.error("Report detail error:", error);
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    // Delete signals first (child records), then attendees, then the room
    await prisma.signal.deleteMany({ where: { roomId } });
    await prisma.attendee.deleteMany({ where: { roomId } });
    await prisma.room.delete({ where: { id: roomId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete report error:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
