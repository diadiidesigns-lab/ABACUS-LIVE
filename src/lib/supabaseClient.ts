import { createClient } from '@supabase/supabase-js';

// The project URL is public; the fallback keeps the browser client working
// if the Vercel variable is missing at build time.
const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lnmrbflvjeuobzggxurz.supabase.co';
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Single client instance shared across the frontend
export const supabase = createClient(supabaseUrl, supabaseAnon);
