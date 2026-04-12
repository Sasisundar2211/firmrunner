'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  FileText,
  CreditCard,
  Bot,
  Settings,
  LogOut,
} from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

const NAV_ITEMS = [
  { href: '/dashboard',           label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/clients',   label: 'Clients',   icon: Users },
  { href: '/dashboard/deadlines', label: 'Deadlines', icon: CalendarClock },
  { href: '/dashboard/documents', label: 'Documents', icon: FileText },
  { href: '/dashboard/billing',   label: 'Billing',   icon: CreditCard },
  { href: '/dashboard/agents',    label: 'AI Agents', icon: Bot },
  { href: '/dashboard/settings',  label: 'Settings',  icon: Settings },
]

interface SidebarProps {
  firmName: string
  userEmail: string
  userRole: string
  pendingCount: number
}

export default function Sidebar({ firmName, userEmail, userRole, pendingCount }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo / firm header */}
      <div className="flex flex-col px-5 py-5 border-b border-gray-100">
        <span className="text-xs font-semibold tracking-widest text-brand-600 uppercase">
          FirmRunner
        </span>
        <span className="mt-0.5 text-sm font-semibold text-gray-900 truncate">{firmName}</span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon
                size={16}
                className={isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}
                strokeWidth={2}
              />
              <span className="flex-1">{label}</span>
              {href === '/dashboard/agents' && pendingCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-semibold">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{userEmail}</p>
            <p className="text-xs text-gray-400 capitalize">{userRole}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  )
}
