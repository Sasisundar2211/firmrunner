# FirmRunner

FirmRunner is an operations dashboard for accounting firms. It brings client intake, document collection, filing deadlines, billing follow-up, and AI-assisted workflows into one multi-tenant Next.js application.

The application uses an approval-first agent model: generated actions are written to an audit queue and require a human decision before client-facing communication is sent.

## What it includes

- Multi-tenant firm and staff accounts with Supabase authentication and row-level security
- Client intake through Tally and n8n-compatible webhooks
- Client, document, deadline, and invoice dashboards
- Intake, document, deadline, billing, and reporting agents
- Human approval queue and agent activity log
- Configurable AI providers: Anthropic, Google Gemini, or Groq
- Transactional email through Resend
- Stripe subscriptions and webhook-based billing state
- Responsive Next.js dashboard built with TypeScript and Tailwind CSS

## Architecture

```text
Next.js app
  |-- Supabase Auth + PostgreSQL + RLS
  |-- Agent API routes + approval guards
  |-- Anthropic / Gemini / Groq
  |-- Resend email delivery
  |-- Stripe billing + webhooks
  `-- Tally / n8n intake automation
```

Every tenant-owned record carries a `firm_id`. Supabase row-level-security policies isolate firms, while server-side agent routes use a separate shared secret. The full schema is available in [`supabase/schema.sql`](supabase/schema.sql), with incremental changes in [`supabase/migrations`](supabase/migrations).

## Tech stack

- Next.js 16 and React 18
- TypeScript and Tailwind CSS
- Supabase Auth and PostgreSQL
- Anthropic, Google Gemini, and Groq SDKs
- Stripe and Resend
- Zod validation
- Vercel Analytics

## Local setup

### Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project

### Install

```bash
git clone https://github.com/Sasisundar2211/firmrunner.git
cd firmrunner
npm install
```

Create `.env.local` and configure the services you intend to use:

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_AI_PROVIDER=gemini
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=

AGENT_SECRET=
N8N_WEBHOOK_SECRET=

RESEND_API_KEY=
RESEND_FROM_EMAIL=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_GROWTH=
STRIPE_PRICE_SCALE=
```

Only one AI provider key is required when `NEXT_PUBLIC_AI_PROVIDER` selects that provider. Stripe, Resend, and n8n variables are needed only for the corresponding integrations.

### Initialize Supabase

Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor. It creates the application types, tables, indexes, triggers, and row-level-security policies. Review the schema before using it against an existing database.

### Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects authenticated users to the dashboard.

## Validation

```bash
npm run typecheck
npm run build
```

## Project structure

```text
app/                  Pages, layouts, server actions, and API routes
components/           Dashboard, authentication, and agent UI
lib/agents/           Agent workflows, guards, and reports
lib/ai/               Provider selection and prompts
lib/supabase/         Browser/server clients and generated types
supabase/             Complete schema and incremental migrations
```

## Security notes

- Never commit `.env.local`, service-role keys, webhook secrets, or provider API keys.
- Keep the Supabase service-role key on the server only.
- Verify Stripe webhook signatures in production.
- Rotate `AGENT_SECRET` and `N8N_WEBHOOK_SECRET` before deploying.
- Review generated client communications in the approval queue before sending.

## Deployment

The app is designed for Vercel. Add the same environment variables to the deployment project, set `NEXT_PUBLIC_APP_URL` to the production URL, and configure Stripe, Supabase, and Tally/n8n callbacks to use that URL.

## Status

FirmRunner is an active MVP. Review the database policies, billing configuration, and outbound-email controls before using it with production client data.
