import { Metadata } from 'next'
import { createClient, getSessionFirmId } from '@/lib/supabase/server'
import StatsCard from '@/components/dashboard/StatsCard'
import ApprovalQueue from '@/components/agents/ApprovalQueue'

export const metadata: Metadata = { title: 'Dashboard — FirmRunner' }

export default async function DashboardPage() {
  const supabase = createClient()
  const firmId = await getSessionFirmId()

  console.log('[dashboard] firmId:', firmId)

  const [statsRes, queueRes] = await Promise.all([
    supabase
      .from('dashboard_stats')
      .select('*')
      .eq('firm_id', firmId)
      .single(),
    supabase
      .from('queued_emails')
      .select('*')
      .eq('firm_id', firmId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  console.log('[dashboard] dashboard_stats:', {
    data: statsRes.data,
    error: statsRes.error?.message ?? null,
  })
  console.log('[dashboard] queued_emails:', {
    count: queueRes.data?.length ?? 0,
    error: queueRes.error?.message ?? null,
  })

  if (statsRes.error) {
    console.error('[dashboard] dashboard_stats query failed:', statsRes.error)
  }
  if (queueRes.error) {
    console.error('[dashboard] queued_emails query failed:', queueRes.error)
  }

  const stats = statsRes.data
  const pendingEmails = queueRes.data ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatsCard label="Active Clients" value={stats.active_clients} />
          <StatsCard
            label="Deadlines (7 days)"
            value={stats.upcoming_deadlines_7d}
            alert={stats.upcoming_deadlines_7d > 0}
          />
          <StatsCard
            label="Overdue Deadlines"
            value={stats.overdue_deadlines}
            alert={stats.overdue_deadlines > 0}
          />
          <StatsCard
            label="Pending Approvals"
            value={pendingEmails.length}
            alert={pendingEmails.length > 0}
          />
        </div>
      )}

      <section>
        <h2 className="text-lg font-medium text-gray-800 mb-3">Agent Approval Queue</h2>
        <ApprovalQueue
          initialEmails={pendingEmails}
          fetchError={queueRes.error?.message ?? null}
        />
      </section>
    </div>
  )
}
