-- Supabase authorization setup for SSN Milano app

-- Tabella utenti autorizzati
CREATE TABLE IF NOT EXISTS authorized_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabella richieste di accesso
CREATE TABLE IF NOT EXISTS access_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  cognome text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now()
);

-- Se la tabella access_requests esiste già e mancano colonne, usa queste istruzioni aggiuntive:
-- ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS nome text NOT NULL;
-- ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS cognome text NOT NULL;
-- ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
-- ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS requested_at timestamptz NOT NULL DEFAULT now();
