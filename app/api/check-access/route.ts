import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && serviceRoleKey && !serviceRoleKey.includes('<')
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

// Scadenza accesso: 12 ore
const ACCESS_EXPIRY_HOURS = 12;

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
      return NextResponse.json({ ok: true, approved: false, fallback: true, reason: 'config_missing' });
    }

    // Controlla se l'utente è autorizzato con questo dispositivo
    const { data: authUser, error: authError } = await supabase
      .from('authorized_users')
      .select('id, approved_at')
      .eq('nome', nome)
      .eq('cognome', cognome)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (authError) {
      throw authError;
    }

    if (authUser) {
      // Controlla scadenza 12 ore
      const approvedAt = new Date(authUser.approved_at || 0);
      const now = new Date();
      const hoursElapsed = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60);

      if (hoursElapsed > ACCESS_EXPIRY_HOURS) {
        // Accesso scaduto: rimuovi l'autorizzazione e la richiesta
        await supabase.from('authorized_users').delete().eq('id', authUser.id);
        await supabase
          .from('access_requests')
          .update({ status: 'expired' })
          .eq('nome', nome)
          .eq('cognome', cognome)
          .eq('device_id', deviceId)
          .eq('status', 'approved');

        return NextResponse.json({ ok: true, approved: false, reason: 'expired' });
      }

      return NextResponse.json({ ok: true, approved: true });
    }

    // Controlla se c'è un'autorizzazione su un altro dispositivo
    const { data: otherDeviceUser } = await supabase
      .from('authorized_users')
      .select('id')
      .eq('nome', nome)
      .eq('cognome', cognome)
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      approved: false,
      ...(otherDeviceUser ? { reason: 'wrong_device' } : {}),
    });
  } catch (error) {
    console.error('Errore check-access route:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore sconosciuto' }, { status: 500 });
  }
}
