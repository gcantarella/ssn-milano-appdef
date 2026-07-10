-- Supabase authorization setup for SSN Milano app

-- Tabella utenti autorizzati
CREATE TABLE IF NOT EXISTS authorized_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  cognome text NOT NULL,
  device_id text NOT NULL,
  device_name text,
  approved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(nome, cognome, device_id)
);

-- Indice per cerche veloci
CREATE INDEX IF NOT EXISTS idx_authorized_users_nome_cognome ON authorized_users(nome, cognome);
CREATE INDEX IF NOT EXISTS idx_authorized_users_device_id ON authorized_users(device_id);

-- Tabella richieste di accesso
CREATE TABLE IF NOT EXISTS access_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  cognome text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now()
);

-- Se le tabelle esistono già e mancano colonne, usa queste istruzioni aggiuntive:
-- ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS nome text NOT NULL;
-- ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS cognome text NOT NULL;
-- ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
-- ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS requested_at timestamptz NOT NULL DEFAULT now();
-- ALTER TABLE authorized_users ADD COLUMN IF NOT EXISTS nome text NOT NULL;
-- ALTER TABLE authorized_users ADD COLUMN IF NOT EXISTS cognome text NOT NULL;
-- ALTER TABLE authorized_users ADD COLUMN IF NOT EXISTS device_id text NOT NULL;
-- ALTER TABLE authorized_users ADD COLUMN IF NOT EXISTS device_name text;
-- ALTER TABLE authorized_users ADD COLUMN IF NOT EXISTS approved_at timestamptz NOT NULL DEFAULT now();
