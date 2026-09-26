-- Keep Prisma's migration history out of reach of Supabase's public API.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
