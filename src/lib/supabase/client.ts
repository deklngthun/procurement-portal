import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  // During build/prerender, env vars may be placeholders — only create a real client
  // when valid URLs are present (starts with https://)
  if (!supabaseUrl.startsWith('https://')) {
    // Return a minimal stub that won't crash during SSR prerendering
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
