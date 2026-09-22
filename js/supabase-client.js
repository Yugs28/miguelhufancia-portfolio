const SUPABASE_URL = 'https://esfxieczshyhpfxqimla.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1LUl4N5qJWK4puWCz_WRzw_q3cLLxxC';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);