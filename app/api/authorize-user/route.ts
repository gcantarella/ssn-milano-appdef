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
    const { nome, cognome, deviceId, deviceName } = body;

    if (!nome || !cognome || !deviceId) {
      return NextResponse.json({ error: 'Nome, cognome e deviceId sono obbligatori.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Configurazione Supabase non valida.' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('authorized_users')
      .upsert(
        [{ nome, cognome, device_id: deviceId, device_name: deviceName }],
        { onConflict: 'nome,cognome,device_id' }
      )
      .select('id')
      .single();

    if (error) {
      console.error('Errore autorizzazione utente:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, userId: data?.id });
  } catch (error) {
    console.error('Errore authorize-user route:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore sconosciuto' }, { status: 500 });
  }
}
