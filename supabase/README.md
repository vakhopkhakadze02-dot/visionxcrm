# Supabase setup

## 1. Database schema

Run `migrations/0001_init.sql` once, either from the Supabase dashboard
(**SQL Editor → New query → Run**) or with the CLI:

```bash
supabase db push
```

It creates the tables, enables Row Level Security and adds the per-user
policies. The app never runs DDL itself — an SQL-executing RPC would be callable
by anyone holding the public anon key.

The same SQL is embedded in the app (`src/dbSchema.ts`) so it can be copied from
the setup screen. **Keep the two in sync when you change either.**

## 2. Notification function

SMS and email are sent by the `send-notification` Edge Function so that provider
credentials stay on the server. Deploy it:

```bash
supabase functions deploy send-notification
```

Then set whichever credentials you have. Each channel works independently; a
channel with no credentials falls back to demo mode (the message is shown to the
operator in-app and logged, but nothing is delivered).

**Twilio (SMS)** — `TWILIO_FROM_NUMBER` must be a Twilio-issued number, not a
personal one:

```bash
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxx TWILIO_AUTH_TOKEN=xxxxxxxx TWILIO_FROM_NUMBER=+12055550100
```

**EmailJS (email)** — the private key is required for server-side sending:

```bash
supabase secrets set EMAILJS_SERVICE_ID=service_xxx EMAILJS_TEMPLATE_ID=template_xxx EMAILJS_PUBLIC_KEY=xxx EMAILJS_PRIVATE_KEY=xxx
```

The EmailJS template receives `to_email`, `to_name`, `message`, `service_name`,
`date`, `time`, `price`, `staff_name`, `notes` and `business_name`.

To rotate a credential, run `supabase secrets set` again — no redeploy needed.

### Twilio gotchas

- **Trial accounts** only deliver to numbers verified under *Phone Numbers →
  Manage → Verified Caller IDs*.
- **Georgian (+995) recipients** need *Messaging → Settings → Geo-Permissions →
  Georgia* enabled, otherwise Twilio rejects the request.

## 3. Client environment

Only the public values belong in the frontend `.env`:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

Never put a Twilio token, EmailJS private key or the Supabase service-role key in
a `VITE_`-prefixed variable — Vite inlines those into the JavaScript bundle.
