import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminKey = process.env.ADMIN_KEY;

const supabase = supabaseUrl && serviceRoleKey && !serviceRoleKey.includes('<')
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

export async function GET(req: Request) {
  try {
    const key = new URL(req.url).searchParams.get('key');

    if (!adminKey || key !== adminKey) {
      return NextResponse.json({ error: 'Non autorizzato.' }, { status: 403 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Configurazione Supabase non valida.' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('access_requests')
      .select('id, nome, cognome, device_id, status, requested_at')
      .order('requested_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Errore lista richieste:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, requests: data || [] });
  } catch (error) {
    console.error('Errore admin list-requests route:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore sconosciuto' }, { status: 500 });
  }
}
