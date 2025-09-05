
import { 
    createClient,
    PostgrestError
} from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './supabaseConfig'; // Import from the new config file

if (!supabaseUrl) {
  const errorMsg = "Supabase URL is not set in the configuration file (lib/supabaseConfig.ts). Authentication will fail.";
  console.error(errorMsg);
  throw new Error(errorMsg);
}

if (!supabaseAnonKey) {
  const errorMsg = "Supabase Anon Key is not set in the configuration file (lib/supabaseConfig.ts). Authentication will fail.";
  console.error(errorMsg);
  throw new Error(errorMsg);
}

// Removing explicit type annotation to allow for better type inference from createClient()
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Re-exporting PostgrestError and Session type.
// AuthError is not exported as it's reported as missing, and will be handled via property checks.
export { PostgrestError };