import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Server-side Supabase client that reads/writes the auth cookie.
 * Use in Server Components, Route Handlers, and Server Actions.
 *
 * IMPORTANT: cookies() is called first, before the env-var guard.
 * During `next build`'s static pre-render phase, cookies() throws
 * a DynamicServerError that Next.js catches to mark the route as
 * dynamic — aborting the pre-render before the env-var check runs.
 * At real request time, both proceed normally.
 */
export function createClient() {
  // Call cookies() first — registers the dynamic dependency so Next.js
  // aborts static pre-render before reaching the env-var check below.
  const cookieStore = cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL — add it to .env.local or Vercel project settings.'
    )
  }
  if (!supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY — add it to .env.local or Vercel project settings.'
    )
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — middleware handles refresh
          }
        },
      },
    }
  )
}

/**
 * Service-role admin client — bypasses RLS.
 * Only use in trusted server contexts (webhooks, cron jobs, migrations).
 * API routes are never statically pre-rendered, so no cookies() guard needed.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL — add it to .env.local or Vercel project settings.'
    )
  }
  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY — add it to .env.local or Vercel project settings.'
    )
  }

  return createSupabaseClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * Returns the current session's firm_id.
 * Throws if the user is not authenticated or has no firm association.
 */
export async function getSessionFirmId(): Promise<string> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthenticated')

  const { data: firmUser } = await supabase
    .from('firm_users')
    .select('firm_id')
    .eq('user_id', user.id)
    .single()

  if (!firmUser) throw new Error('No firm association found')
  return firmUser.firm_id
}
