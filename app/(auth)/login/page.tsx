import { Metadata } from 'next'
import LoginForm from './LoginForm'
import ResendConfirmation from '@/components/auth/ResendConfirmation'

export const metadata: Metadata = { title: 'Sign In — FirmRunner' }

const ERROR_MESSAGES: Record<string, string> = {
  otp_expired:
    'Your confirmation link has expired. Links are valid for 24 hours — request a new one below.',
  access_denied:
    'This link has already been used or has expired — request a new confirmation email below.',
  auth_error:
    'Authentication failed. Please try again.',
  missing_code:
    'Invalid link. Please request a new one.',
}

// These error codes indicate the user needs to re-confirm their email
const NEEDS_RESEND = new Set(['otp_expired', 'access_denied'])

interface Props {
  searchParams: { error?: string; error_code?: string }
}

export default function LoginPage({ searchParams }: Props) {
  const errorKey = searchParams.error_code ?? searchParams.error
  const errorMessage = errorKey ? (ERROR_MESSAGES[errorKey] ?? `Sign-in error: ${errorKey}`) : null
  const showResend = errorKey ? NEEDS_RESEND.has(errorKey) : false

  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {errorMessage && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {errorMessage}
        </div>
      )}

      {showResend ? (
        <div className="space-y-6">
          <ResendConfirmation />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400 uppercase tracking-wide">
              <span className="bg-white px-3">or sign in</span>
            </div>
          </div>
          <LoginForm />
        </div>
      ) : (
        <LoginForm />
      )}
    </div>
  )
}
