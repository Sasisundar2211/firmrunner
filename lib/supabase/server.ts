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
export async function createClient() {
  // In Next.js 15+, cookies() is async — must be awaited.
  const cookieStore = await cookies()

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
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthenticated')

  const { data: firmUser } = await supabase
    .from('firm_users')
    .select('firm_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (firmUser?.firm_id) return firmUser.firm_id

  // Fallback: If DB trigger hasn't created the firm/firm_user row yet,
  // create it using admin client so login/signup never breaks for the user.
  const adminSupabase = createAdminClient()
  const firmName =
    (user.user_metadata?.firm_name as string | undefined)?.trim() ||
    `${user.email?.split('@')[0] || 'My'}'s Firm`

  const { data: newFirm, error: firmErr } = await adminSupabase
    .from('firms')
    .insert({
      name: firmName,
      owner_email: user.email || '',
    })
    .select('id')
    .single()

  if (firmErr || !newFirm) {
    throw new Error(`Failed to initialize firm: ${firmErr?.message || 'Unknown error'}`)
  }

  const { error: userErr } = await adminSupabase
    .from('firm_users')
    .insert({
      firm_id: newFirm.id,
      user_id: user.id,
      role: 'owner',
      email: user.email || '',
      full_name: (user.user_metadata?.full_name as string | undefined) || null,
    })

  if (userErr) {
    throw new Error(`Failed to associate user with firm: ${userErr.message}`)
  }

  return newFirm.id
}
