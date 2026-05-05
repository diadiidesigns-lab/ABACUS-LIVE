"use client";

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import StudentAbacus from "@/components/StudentAbacus";

function StudentPageInner() {
  const { roomId } = useParams<{ roomId: string }>();
  return <StudentAbacus roomId={roomId} />;
}

export default function StudentPage() {
  return (
    <Suspense>
      <StudentPageInner />
    </Suspense>
  );
}
