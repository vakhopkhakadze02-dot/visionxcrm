-- 1. Create Tables with User Isolation
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

-- 2. Add missing columns if tables already existed without them
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lead_value NUMERIC;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tag TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE followups ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

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

-- 6. Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';
