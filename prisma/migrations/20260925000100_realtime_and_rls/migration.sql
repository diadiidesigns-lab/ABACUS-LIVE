-- Lock down direct access through Supabase's public API (anon key).
-- Prisma connects as the table owner, so the app itself is not affected.
ALTER TABLE "Room" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attendee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Signal" ENABLE ROW LEVEL SECURITY;

-- Supabase Realtime only delivers rows the browser is allowed to read,
-- so allow read-only access to the two tables the UI listens to.
CREATE POLICY "Realtime read access" ON "Room" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Realtime read access" ON "Attendee" FOR SELECT TO anon, authenticated USING (true);

-- Broadcast changes to Room and Attendee (MirrorDashboard.tsx, StudentAbacus.tsx).
ALTER PUBLICATION supabase_realtime ADD TABLE "Room", "Attendee";
