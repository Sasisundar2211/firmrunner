'use client'

import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

interface ResendConfirmationProps {
  /** Pre-fill if the user already typed their email; otherwise they enter it. */
  defaultEmail?: string
}

export default function ResendConfirmation({ defaultEmail = '' }: ResendConfirmationProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleResend() {
    const trimmed = email.trim()
    if (!trimmed) return

    setStatus('sending')
    setErrorMsg('')

    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email: trimmed })

    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  if (status === 'sent') {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-3">
        Confirmation email sent — check your inbox (and spam folder).
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Enter your email address and we&apos;ll send a new confirmation link.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          onClick={handleResend}
          disabled={status === 'sending' || !email.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 disabled:opacity-50 whitespace-nowrap"
        >
          {status === 'sending' ? 'Sending…' : 'Resend email'}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
    </div>
  )
}
