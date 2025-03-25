const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Check for required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_KEY');
}

// Create a Supabase client with the service role for full access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    // Set default headers for all requests to bypass RLS
    global: {
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_KEY}`
      },
    },
  }
);

// Log connection status
console.log('Supabase client initialized with role:', 
  process.env.SUPABASE_KEY.includes('service_role') ? 'service_role' : 'anon');

module.exports = supabase; 