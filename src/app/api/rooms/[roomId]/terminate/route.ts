import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function terminateRoom(roomId: string) {
  await prisma.room.update({
    where: { id: roomId },
    data: { isLive: false },
  });
  return NextResponse.json({ success: true });
}

export async function POST(_req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    return await terminateRoom(roomId);
  } catch (error) {
    console.error("Terminate room error:", error);
    return NextResponse.json({ error: "Failed to terminate room" }, { status: 500 });
  }
}

export async function PATCH(_req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    return await terminateRoom(roomId);
  } catch (error) {
    console.error("Terminate room error:", error);
    return NextResponse.json({ error: "Failed to terminate room" }, { status: 500 });
  }
}
