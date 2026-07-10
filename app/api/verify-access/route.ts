import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && (serviceRoleKey && !serviceRoleKey.includes('<')
  ? createClient(supabaseUrl, serviceRoleKey)
  : anonKey && !anonKey.includes('<')
    ? createClient(supabaseUrl, anonKey)
    : null);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, cognome, deviceId } = body;

    if (!nome || !cognome || !deviceId) {
      return NextResponse.json({ error: 'Nome, cognome e deviceId sono obbligatori.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Configurazione Supabase non valida.' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('authorized_users')
      .select('id, device_id')
      .eq('nome', nome)
      .eq('cognome', cognome)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (error) {
      console.error('Errore verifica accesso:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: true, authorized: false, reason: 'user_not_found' });
    }

    return NextResponse.json({ ok: true, authorized: true });
  } catch (error) {
    console.error('Errore verify-access route:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore sconosciuto' }, { status: 500 });
  }
}
