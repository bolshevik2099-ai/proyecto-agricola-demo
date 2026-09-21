import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wyddlbaasbonhhzfxrmb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_7YUlifBrqoV2Pr3JckleKw_mJkMyfvs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
