import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL || 'gestioneiagiovanni@gmail.com';
const emailHost = process.env.EMAIL_SERVER_HOST;
const emailPort = process.env.EMAIL_SERVER_PORT;
const emailUser = process.env.EMAIL_SERVER_USER;
const emailPass = process.env.EMAIL_SERVER_PASSWORD;
const emailFrom = process.env.EMAIL_FROM;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE service environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

if (!emailHost || !emailPort || !emailUser || !emailPass || !emailFrom) {
  throw new Error('Missing email environment variables. Set EMAIL_SERVER_HOST, EMAIL_SERVER_PORT, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, and EMAIL_FROM.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nome = String(body.nome || '').trim();
    const cognome = String(body.cognome || '').trim();

    if (!nome || !cognome) {
      return NextResponse.json({ error: 'Nome e cognome sono obbligatori.' }, { status: 400 });
    }

    const { error: insertError } = await supabase.from('access_requests').insert([
      {
        nome,
        cognome,
        email: '',
        status: 'pending',
      },
    ]);

    if (insertError) {
      console.error('Errore inserimento richiesta accesso:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: Number(emailPort),
      secure: process.env.EMAIL_SERVER_SECURE === 'true',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const message = {
      from: emailFrom,
      to: adminEmail,
      subject: `Richiesta accesso app SSN Milano: ${nome} ${cognome}`,
      text: `L'utente ${nome} ${cognome} ha richiesto l'accesso all'app SSN Milano.

Apri Supabase e gestisci la richiesta in access_requests oppure autorizza l'accesso manualmente.`,
      html: `<p>L'utente <strong>${nome} ${cognome}</strong> ha richiesto l'accesso all'app <strong>SSN Milano</strong>.</p><p>Apri Supabase e gestisci la richiesta in <strong>access_requests</strong> oppure autorizza l'accesso manualmente.</p>`,
    };

    await transporter.sendMail(message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Errore access-request route:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore sconosciuto' }, { status: 500 });
  }
}
