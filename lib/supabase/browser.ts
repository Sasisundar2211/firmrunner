'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

/**
 * Singleton browser-side Supabase client.
 * Use in Client Components only (files with 'use client').
 */
export function getSupabaseBrowserClient() {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
      throw new Error(
        'Missing environment variable: NEXT_PUBLIC_SUPABASE_URL. ' +
        'Add it to your .env.local file (development) or Vercel project settings (production).'
      )
    }
    if (!supabaseAnonKey) {
      throw new Error(
        'Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Add it to your .env.local file (development) or Vercel project settings (production).'
      )
    }

    client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return client
}
