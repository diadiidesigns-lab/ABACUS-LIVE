"use client";

import { useParams } from 'next/navigation';
import MirrorDashboard from "@/components/MirrorDashboard";

export default function MirrorPage() {
  const { roomId } = useParams<{ roomId: string }>();
  return <MirrorDashboard roomId={roomId} />;
}
