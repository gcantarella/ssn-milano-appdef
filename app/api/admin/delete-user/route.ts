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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, adminKey: providedKey } = body;

    if (!adminKey || providedKey !== adminKey) {
      return NextResponse.json({ error: 'Non autorizzato.' }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId è obbligatorio.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Configurazione Supabase non valida.' }, { status: 500 });
    }

    const { error } = await supabase
      .from('authorized_users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Errore eliminazione utente:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Errore admin delete-user route:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore sconosciuto' }, { status: 500 });
  }
}
