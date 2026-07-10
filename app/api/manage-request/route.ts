import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && serviceRoleKey && !serviceRoleKey.includes('<')
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action');

    if (!id || !action || (action !== 'approve' && action !== 'reject')) {
      return htmlResponse('Errore', '❌ Parametri non validi.', '#ef4444');
    }

    if (!supabase) {
      return htmlResponse('Errore configurazione', '❌ Supabase non configurato correttamente.', '#ef4444');
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Recupera i dati della richiesta
    const { data: requestData, error: fetchError } = await supabase
      .from('access_requests')
      .select('nome, cognome, device_id, status')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !requestData) {
      return htmlResponse('Richiesta non trovata', '❌ La richiesta non esiste o è già stata gestita.', '#ef4444');
    }

    if (requestData.status === 'approved' || requestData.status === 'rejected') {
      const alreadyMsg = requestData.status === 'approved' ? 'già approvata ✅' : 'già rifiutata ❌';
      return htmlResponse('Già gestita', `Questa richiesta è stata ${alreadyMsg} in precedenza.`, '#f59e0b');
    }

    // Aggiorna lo status della richiesta
    await supabase
      .from('access_requests')
      .update({ status: newStatus })
      .eq('id', id);

    // Se approvata, inserisci l'utente nella tabella authorized_users
    if (action === 'approve' && requestData.device_id) {
      const { error: authError } = await supabase
        .from('authorized_users')
        .upsert(
          [{
            nome: requestData.nome,
            cognome: requestData.cognome,
            device_id: requestData.device_id,
            device_name: 'Dispositivo principale',
            approved_at: new Date().toISOString(),
          }],
          { onConflict: 'nome,cognome,device_id' }
        );

      if (authError) {
        console.error('Errore inserimento authorized_users:', authError.message);
      }
    }

    const isApprove = action === 'approve';
    return htmlResponse(
      isApprove ? 'Utente Approvato ✅' : 'Richiesta Rifiutata ❌',
      isApprove
        ? `<strong>${requestData.nome} ${requestData.cognome}</strong> è stato autorizzato. Il loro browser si aggiornerà entro pochi secondi automaticamente.`
        : `La richiesta di <strong>${requestData.nome} ${requestData.cognome}</strong> è stata rifiutata.`,
      isApprove ? '#10b981' : '#ef4444'
    );

  } catch (error) {
    console.error('Errore manage-request route:', error);
    return htmlResponse('Errore server', '❌ Si è verificato un errore interno.', '#ef4444');
  }
}

function htmlResponse(title: string, body: string, color: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — SSN Milano</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f1f5f9;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:white;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);padding:48px 40px;max-width:480px;width:100%;text-align:center}
    .icon{font-size:56px;margin-bottom:20px}
    h1{color:#111827;font-size:24px;font-weight:700;margin-bottom:12px}
    p{color:#4b5563;font-size:15px;line-height:1.7;margin-bottom:28px}
    .badge{display:inline-block;background:${color}18;color:${color};padding:8px 20px;border-radius:999px;font-weight:600;font-size:14px;border:1px solid ${color}30}
    .hint{margin-top:28px;font-size:13px;color:#9ca3af}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${color === '#10b981' ? '✅' : color === '#f59e0b' ? '⚠️' : '❌'}</div>
    <h1>${title}</h1>
    <p>${body}</p>
    <div class="badge">SSN Milano Admin</div>
    <p class="hint">Puoi chiudere questa scheda.</p>
  </div>
</body>
</html>`;
  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
