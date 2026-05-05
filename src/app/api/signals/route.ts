import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    const signals = await prisma.signal.findMany({
      where: {
        ...(roomId ? { roomId } : {}),
        timestamp: {
          gte: new Date(Date.now() - 30 * 60 * 1000)
        }
      },
      orderBy: { timestamp: 'asc' } 
    });

    return NextResponse.json(signals);
  } catch (error) {
    console.error("Database Error in API:", error);
    return NextResponse.json([], { status: 500 });
  }
}