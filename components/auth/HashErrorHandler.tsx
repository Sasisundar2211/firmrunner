'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Detects Supabase auth error hash fragments (e.g. #error=access_denied&error_code=otp_expired)
 * that land on any page when the user has an active session.
 *
 * Hash fragments are never sent to the server so middleware can't catch them.
 * This component reads window.location.hash client-side on every navigation,
 * strips the fragment from the URL, and redirects to /login?error=...&error_code=...
 * so the existing error banner logic on the login page handles display.
 *
 * Already on /login? Just strip the hash — the error is already shown via searchParams.
 */
export default function HashErrorHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const hash = window.location.hash
    if (!hash || !hash.includes('error=')) return

    // Parse the hash as URLSearchParams (strip leading #)
    const params = new URLSearchParams(hash.slice(1))
    const error = params.get('error')
    const errorCode = params.get('error_code')

    if (!error) return

    // Always clean the hash from the current URL first
    window.history.replaceState(null, '', window.location.pathname + window.location.search)

    // If already on login, nothing more to do — searchParams drive the UI there
    if (pathname === '/login') return

    // Redirect to login with the error as query params so the error banner renders
    const loginParams = new URLSearchParams({ error })
    if (errorCode) loginParams.set('error_code', errorCode)
    router.replace(`/login?${loginParams.toString()}`)
  }, [pathname, router])

  return null
}
