import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && serviceRoleKey && !serviceRoleKey.includes('<')
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nome = String(body.nome || '').trim();
    const cognome = String(body.cognome || '').trim();
    const deviceId = String(body.deviceId || '').trim();

    if (!nome || !cognome || !deviceId) {
      return NextResponse.json({ error: 'Nome, cognome e deviceId sono obbligatori.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Configurazione Supabase mancante.' }, { status: 500 });
    }

    // Prima controlla se c'è una richiesta approved per questa persona
    const { data: requestData } = await supabase
      .from('access_requests')
      .select('id, status')
      .eq('nome', nome)
      .eq('cognome', cognome)
      .eq('status', 'approved')
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!requestData) {
      // Nessuna richiesta approvata
      return NextResponse.json({ ok: true, approved: false });
    }

    // Verifica che il device_id coincida con quello autorizzato
    const { data: authUser } = await supabase
      .from('authorized_users')
      .select('id, device_id')
      .eq('nome', nome)
      .eq('cognome', cognome)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (!authUser) {
      // Approvato ma da un dispositivo diverso
      return NextResponse.json({ ok: true, approved: false, reason: 'wrong_device' });
    }

    return NextResponse.json({ ok: true, approved: true });
  } catch (error) {
    console.error('Errore check-access route:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore sconosciuto' }, { status: 500 });
  }
}
