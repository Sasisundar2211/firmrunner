import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [firmUserRes, pendingRes] = await Promise.all([
    supabase
      .from('firm_users')
      .select('*, firms(name, subscription_plan)')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('queued_emails')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const firmUser = firmUserRes.data
  const firmName = (firmUser?.firms as { name: string } | null)?.name ?? 'My Firm'
  const pendingCount = pendingRes.count ?? 0

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left sidebar */}
      <Sidebar
        firmName={firmName}
        userEmail={user.email ?? ''}
        userRole={firmUser?.role ?? 'staff'}
        pendingCount={pendingCount}
      />

      {/* Right column: top bar + scrollable content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar firmName={firmName} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
