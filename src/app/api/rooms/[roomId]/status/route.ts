import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { isLive: true },
    });
    if (!room) return NextResponse.json({ isLive: false });
    return NextResponse.json({ isLive: room.isLive });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ isLive: false }, { status: 500 });
  }
}
