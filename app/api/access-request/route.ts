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

    const { data: requestData, error: insertError } = await supabase.from('access_requests').insert([
      {
        nome,
        cognome,
        email: '',
        status: 'pending',
      },
    ]).select('id').single();

    if (insertError || !requestData) {
      console.error('Errore inserimento richiesta accesso:', insertError);
      return NextResponse.json({ error: insertError?.message || 'Errore durante l\'inserimento' }, { status: 500 });
    }

    const baseUrl = req.headers.get('origin') || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : new URL(req.url).origin);
    const approveUrl = `${baseUrl}/api/manage-request?id=${requestData.id}&action=approve`;
    const rejectUrl = `${baseUrl}/api/manage-request?id=${requestData.id}&action=reject`;

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
      text: `L'utente ${nome} ${cognome} ha richiesto l'accesso all'app SSN Milano.\n\nApprova: ${approveUrl}\nRifiuta: ${rejectUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #111827; margin-top: 0;">Nuova richiesta di accesso</h2>
          <p style="font-size: 16px; line-height: 1.5;">L'utente <strong>${nome} ${cognome}</strong> ha richiesto l'accesso all'app <strong>SSN Milano</strong>.</p>
          <p style="font-size: 16px; line-height: 1.5;">Puoi approvare o rifiutare la richiesta direttamente da qui:</p>
          <div style="margin-top: 30px; margin-bottom: 30px;">
            <a href="${approveUrl}" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 15px; display: inline-block;">✅ Approva</a>
            <a href="${rejectUrl}" style="background-color: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">❌ Rifiuta</a>
          </div>
          <p style="margin-top: 30px; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px;">Se i pulsanti non funzionano, gestisci la richiesta manualmente nella tabella access_requests su Supabase.</p>
        </div>
      `,
    };

    await transporter.sendMail(message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Errore access-request route:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore sconosciuto' }, { status: 500 });
  }
}
