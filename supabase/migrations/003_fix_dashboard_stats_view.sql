-- =============================================================================
-- FirmRunner — Fix dashboard_stats view
--
-- Recreates the view WITH (security_invoker = true) so RLS policies on all
-- underlying tables are enforced using the *calling* user's role, not the
-- view owner (postgres). Without this, auth.uid() inside current_firm_id()
-- may not resolve correctly when the view is queried by authenticated users.
--
-- Also removes pending_agent_approvals from the view — that counter is now
-- derived directly from queued_emails in the application layer, so it doesn't
-- need to be aggregated here.
--
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → paste + run).
-- =============================================================================

-- DROP required because CREATE OR REPLACE cannot change column types
DROP VIEW IF EXISTS public.dashboard_stats;

CREATE VIEW public.dashboard_stats
WITH (security_invoker = true)
AS
SELECT
    f.id AS firm_id,

    -- Clients
    COUNT(DISTINCT c.id)                                                          AS total_clients,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active')                      AS active_clients,

    -- Deadlines
    COUNT(DISTINCT d.id) FILTER (
        WHERE d.status NOT IN ('completed', 'extended')
          AND d.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    )                                                                             AS upcoming_deadlines_7d,
    COUNT(DISTINCT d.id) FILTER (
        WHERE d.status NOT IN ('completed', 'extended')
          AND d.due_date < CURRENT_DATE
    )                                                                             AS overdue_deadlines,

    -- Documents
    COUNT(DISTINCT doc.id) FILTER (
        WHERE doc.status IN ('required', 'requested')
    )                                                                             AS pending_documents,

    -- Invoices
    COUNT(DISTINCT i.id) FILTER (
        WHERE i.status IN ('sent', 'overdue')
    )                                                                             AS unpaid_invoices,

    -- Agent logs (kept for historical sent count; pending_agent_approvals now from queued_emails in app)
    0::bigint                                                                     AS pending_agent_approvals,
    COUNT(DISTINCT al.id) FILTER (
        WHERE al.status = 'sent'
          AND al.sent_at >= NOW() - INTERVAL '30 days'
    )                                                                             AS agents_sent_30d

FROM public.firms f
LEFT JOIN public.clients    c   ON c.firm_id  = f.id AND c.deleted_at IS NULL
LEFT JOIN public.deadlines  d   ON d.firm_id  = f.id
LEFT JOIN public.documents  doc ON doc.firm_id = f.id
LEFT JOIN public.invoices   i   ON i.firm_id  = f.id
LEFT JOIN public.agent_logs al  ON al.firm_id = f.id
GROUP BY f.id;

COMMENT ON VIEW public.dashboard_stats IS
    'Per-firm dashboard aggregates. security_invoker=true ensures RLS is enforced for the calling user.';
