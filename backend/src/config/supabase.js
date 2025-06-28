import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '[SET]' : '[NOT SET]');
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}. Please ensure it includes the protocol (https://)`);
}

// Create Supabase client with service role key for backend operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create client for user operations (with anon key)
export const supabaseClient = createClient(
  supabaseUrl, 
  process.env.SUPABASE_ANON_KEY || supabaseServiceKey
);

export default supabase;