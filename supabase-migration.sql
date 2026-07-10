-- ============================================================
-- Migrazione SSN Milano App
-- Da eseguire UNA VOLTA nell'SQL Editor di Supabase
-- ============================================================

-- 1. Aggiorna tabella authorized_users con le colonne necessarie
ALTER TABLE authorized_users
  ADD COLUMN IF NOT EXISTS nome text,
  ADD COLUMN IF NOT EXISTS cognome text,
  ADD COLUMN IF NOT EXISTS device_id text,
  ADD COLUMN IF NOT EXISTS device_name text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz DEFAULT now();

-- 2. Aggiorna tabella access_requests con la colonna device_id
ALTER TABLE access_requests
  ADD COLUMN IF NOT EXISTS device_id text;

-- 3. Crea un indice unico su nome+cognome+device_id per l'upsert
CREATE UNIQUE INDEX IF NOT EXISTS authorized_users_nome_cognome_device_id_idx
  ON authorized_users (nome, cognome, device_id);

-- 4. Abilita Row Level Security
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- 5. Policy: solo la service role può leggere/scrivere
DROP POLICY IF EXISTS "Service role full access authorized_users" ON authorized_users;
CREATE POLICY "Service role full access authorized_users"
  ON authorized_users FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access access_requests" ON access_requests;
CREATE POLICY "Service role full access access_requests"
  ON access_requests FOR ALL TO service_role
  USING (true) WITH CHECK (true);
