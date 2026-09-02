import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Falta la configuración pública de Supabase. Verifica SUPABASE_URL y SUPABASE_ANON_KEY en config.js.'
  );
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);