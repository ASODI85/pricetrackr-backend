import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey     = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('SUPABASE_URL environment variable is not set');
if (!serviceKey)  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');

export const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

export const supabaseAnon = createClient(supabaseUrl, anonKey);
