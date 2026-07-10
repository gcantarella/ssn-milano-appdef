import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL || 'gestioneiagiovanni@gmail.com';
const emailHost = process.env.EMAIL_SERVER_HOST;
const emailPort = process.env.EMAIL_SERVER_PORT;
const emailUser = process.env.EMAIL_SERVER_USER;
const emailPass = process.env.EMAIL_SERVER_PASSWORD;
const emailFrom = process.env.EMAIL_FROM;

const supabase = supabaseUrl && serviceRoleKey && !serviceRoleKey.includes('<')
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nome = String(body.nome || '').trim();
    const cognome = String(body.cognome || '').trim();
    const deviceId = String(body.deviceId || '').trim();

    if (!nome || !cognome) {
      return NextResponse.json({ error: 'Nome e cognome sono obbligatori.' }, { status: 400 });
    }

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID mancante.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Configurazione Supabase mancante o non valida.' }, { status: 500 });
    }

    if (!emailHost || !emailPort || !emailUser || !emailPass || !emailFrom) {
      return NextResponse.json({ error: 'Configurazione email mancante.' }, { status: 500 });
    }

    // Controlla se c'è già una richiesta pendente o approvata per questo device
    const { data: existing } = await supabase
      .from('access_requests')
      .select('id, status')
      .eq('nome', nome)
      .eq('cognome', cognome)
      .eq('device_id', deviceId)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyExists: true,
        status: existing.status,
      });
    }

    const { data: requestData, error: insertError } = await supabase
      .from('access_requests')
      .insert([{ nome, cognome, email: '', device_id: deviceId, status: 'pending' }])
      .select('id')
      .single();

    if (insertError || !requestData) {
      console.error('Errore inserimento richiesta accesso:', insertError);
      return NextResponse.json({ error: insertError?.message || 'Errore durante l\'inserimento' }, { status: 500 });
    }

    const baseUrl = req.headers.get('origin')
      || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : new URL(req.url).origin);
    const approveUrl = `${baseUrl}/api/manage-request?id=${requestData.id}&action=approve`;
    const rejectUrl = `${baseUrl}/api/manage-request?id=${requestData.id}&action=reject`;

    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: Number(emailPort),
      secure: process.env.EMAIL_SERVER_SECURE === 'true',
      auth: { user: emailUser, pass: emailPass },
    });

    await transporter.sendMail({
      from: emailFrom,
      to: adminEmail,
      subject: `Richiesta accesso SSN Milano: ${nome} ${cognome}`,
      text: `${nome} ${cognome} ha richiesto l'accesso.\nDevice ID: ${deviceId}\n\nApprova: ${approveUrl}\nRifiuta: ${rejectUrl}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
          <h2 style="color:#111827;margin-top:0;">🔐 Nuova richiesta di accesso — SSN Milano</h2>
          <p style="font-size:16px;line-height:1.6;">L'utente <strong>${nome} ${cognome}</strong> ha richiesto l'accesso all'app.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
            <tr><td style="padding:8px;color:#6b7280;width:140px;">Nome</td><td style="padding:8px;font-weight:600;">${nome} ${cognome}</td></tr>
            <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Device ID</td><td style="padding:8px;font-family:monospace;font-size:12px;">${deviceId}</td></tr>
          </table>
          <div style="margin:28px 0;display:flex;gap:12px;">
            <a href="${approveUrl}" style="background:#10b981;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;margin-right:12px;display:inline-block;">✅ Approva</a>
            <a href="${rejectUrl}" style="background:#ef4444;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;display:inline-block;">❌ Rifiuta</a>
          </div>
          <p style="margin-top:24px;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:14px;">Gestisci le richieste anche dal pannello admin su <strong>${baseUrl}/admin</strong></p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Errore access-request route:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore sconosciuto' }, { status: 500 });
  }
}
