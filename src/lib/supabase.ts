// This file has been emptied to remove Supabase dependencies.
// The open-source version uses local configuration instead.

// Export empty objects to prevent import errors in case any components still reference this file
// export const supabase = {
//   auth: {
//     getUser: async () => ({ data: { user: null } }),
//     onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
//     signOut: async () => ({ error: null }),
//     exchangeCodeForSession: async () => ({ error: null }),
//     signInWithOAuth: async () => ({ data: null, error: null })
//   },
//   from: () => ({
//     select: () => ({
//       eq: () => ({
//         single: async () => null,
//         maybeSingle: async () => null
//       })
//     }),
//     update: () => ({
//       eq: () => ({
//         select: () => ({
//           single: async () => null
//         })
//       })
//     })
//   }),
//   channel: () => ({
//     on: () => ({
//       subscribe: () => ({
//         unsubscribe: () => {}
//       })
//     })
//   })
// };

// export const signInWithGoogle = async () => {
//   console.log("Sign in with Google not available in open-source version");
//   return { data: null };
// };




import { createClient } from '@supabase/supabase-js';

// Hard-code your credentials here for testing
const SUPABASE_URL = "https://lviilhlflnlpoxeadhlt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2aWlsaGxmbG5scG94ZWFkaGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2OTA1ODMsImV4cCI6MjA2MTI2NjU4M30.jc-CV2VbCvCVy5DxcXjXXYlKn5V-EyV7ZW05FlWbL88";

// export const supabase = createClient(
//   import.meta.env.VITE_SUPABASE_URL,
//   import.meta.env.VITE_SUPABASE_ANON_KEY
// )

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);