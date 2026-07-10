import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adminKey = process.env.ADMIN_KEY;

const supabase = supabaseUrl && (serviceRoleKey && !serviceRoleKey.includes('<')
  ? createClient(supabaseUrl, serviceRoleKey)
  : anonKey && !anonKey.includes('<')
    ? createClient(supabaseUrl, anonKey)
    : null);

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
      .from('authorized_users')
      .select('id, nome, cognome, device_name, approved_at, created_at')
      .order('approved_at', { ascending: false });

    if (error) {
      console.error('Errore lista utenti:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, users: data || [] });
  } catch (error) {
    console.error('Errore admin list-users route:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore sconosciuto' }, { status: 500 });
  }
}
