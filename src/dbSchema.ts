/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The complete database schema, shown in-app whenever setup or a migration is
 * needed. Kept identical to supabase/migrations/0001_init.sql — update both.
 *
 * Run it from the Supabase SQL Editor (or `supabase db push`). The app never
 * executes DDL itself: doing so would require a privileged SQL-executing RPC,
 * which anyone holding the public anon key could then call.
 */
export const SETUP_SQL = `-- 1. Create Tables with User Isolation
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  role TEXT DEFAULT 'მფლობელი',
  phone TEXT,
  email TEXT,
  address TEXT,
  category TEXT,
  logo_color TEXT DEFAULT 'bg-indigo-600 text-white'
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  source TEXT,
  lead_value NUMERIC,
  assigned_staff_id TEXT,
  communications JSONB,
  attachments JSONB,
  notes TEXT,
  tag TEXT
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration INT NOT NULL,
  category TEXT NOT NULL,
  color TEXT DEFAULT 'blue'
);

CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_color TEXT DEFAULT 'bg-indigo-600 text-white',
  rating NUMERIC DEFAULT 5.0,
  status TEXT DEFAULT 'აქტიური'
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT,
  client_id TEXT,
  service_id TEXT,
  staff_id TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  price NUMERIC NOT NULL,
  status TEXT DEFAULT 'მოლოდინში',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS followups (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT,
  client_id TEXT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  type TEXT NOT NULL,
  topic TEXT NOT NULL,
  status TEXT DEFAULT 'მოლოდინში',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT,
  client_id TEXT,
  client_name TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  doc_number TEXT NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  due_date TEXT,
  status TEXT DEFAULT 'გაგზავნილი',
  items JSONB,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id TEXT,
  title TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  trigger_label TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_label TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  execution_count INT DEFAULT 0
);

-- Shared reference data, not owned by any user: NBG rates, one row per day
-- and currency. Written only by the exchange-rates function (service role).
CREATE TABLE IF NOT EXISTS exchange_rates (
  date TEXT NOT NULL,
  code TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (date, code)
);

-- 2. Add missing columns if tables already existed without them
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_value NUMERIC;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS assigned_staff_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS communications JSONB;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS attachments JSONB;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tag TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE followups ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Every priced record carries the currency it was created in, so changing the
-- business currency later can never relabel historical amounts. Existing rows
-- default to GEL, which is what they were entered in before this column existed.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GEL';
ALTER TABLE services ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GEL';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GEL';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GEL';

-- 3. Grant table permissions to signed-in users
-- Note: no grants to the "anon" role. Every query this app makes is
-- authenticated, and anon holds the public key that ships in the bundle, so
-- granting it table access would leave RLS as the only thing standing between
-- the internet and the data.
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies so users can ONLY access their own data
DROP POLICY IF EXISTS "Users can manage their own businesses" ON businesses;
CREATE POLICY "Users can manage their own businesses" ON businesses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own clients" ON clients;
CREATE POLICY "Users can manage their own clients" ON clients FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own services" ON services;
CREATE POLICY "Users can manage their own services" ON services FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own staff" ON staff;
CREATE POLICY "Users can manage their own staff" ON staff FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own bookings" ON bookings;
CREATE POLICY "Users can manage their own bookings" ON bookings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own followups" ON followups;
CREATE POLICY "Users can manage their own followups" ON followups FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own documents" ON documents;
CREATE POLICY "Users can manage their own documents" ON documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own workflows" ON workflows;
CREATE POLICY "Users can manage their own workflows" ON workflows FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Exchange rates are public reference data: any signed-in user may read them,
-- but only the exchange-rates function (service role, which bypasses RLS) may
-- write. No insert/update policy is defined, so client writes are refused.
DROP POLICY IF EXISTS "Signed-in users can read exchange rates" ON exchange_rates;
CREATE POLICY "Signed-in users can read exchange rates" ON exchange_rates FOR SELECT TO authenticated USING (true);

-- 6. Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';`;

/**
 * Client columns introduced after the original schema. On a project where the
 * newer migration has not been run, writing them fails the whole row — so the
 * write is retried without them and the core fields (name, phone, email, notes)
 * still save. The migration banner tells the user how to stop losing the rest.
 */
export const CLIENT_COLUMNS_ADDED_LATER = [
  "tag",
  "business_id",
  "company",
  "source",
  "lead_value",
  "assigned_staff_id",
  "communications",
  "attachments"
] as const;

export const stripNewerClientColumns = (payload: Record<string, any>): Record<string, any> => {
  const core = { ...payload };
  CLIENT_COLUMNS_ADDED_LATER.forEach(column => delete core[column]);
  return core;
};

/** The one statement needed when only the newer 'tag' column is missing. */
export const TAG_MIGRATION_SQL = `ALTER TABLE clients ADD COLUMN IF NOT EXISTS tag TEXT;
NOTIFY pgrst, 'reload schema';`;
