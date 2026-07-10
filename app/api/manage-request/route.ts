import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE service environment variables.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action'); // 'approve' or 'reject'

    if (!id || !action) {
      return new NextResponse('Parametri mancanti.', { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return new NextResponse('Azione non valida.', { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { error } = await supabase
      .from('access_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Errore aggiornamento richiesta:', error);
      return new NextResponse(`Errore durante l'aggiornamento: ${error.message}`, { status: 500 });
    }

    // HTML UI Response
    const color = action === 'approve' ? '#10b981' : '#ef4444';
    const title = action === 'approve' ? 'Richiesta Approvata' : 'Richiesta Rifiutata';
    const message = action === 'approve' 
      ? 'L\'utente è stato approvato con successo.' 
      : 'La richiesta dell\'utente è stata rifiutata.';

    const html = `
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f3f4f6;
          }
          .card {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            text-align: center;
            max-width: 400px;
            width: 90%;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 20px;
          }
          h1 {
            color: #111827;
            margin-top: 0;
            font-size: 24px;
          }
          p {
            color: #4b5563;
            margin-bottom: 30px;
          }
          .status {
            display: inline-block;
            background-color: ${color}20;
            color: ${color};
            padding: 8px 16px;
            border-radius: 9999px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${action === 'approve' ? '✅' : '❌'}</div>
          <h1>${title}</h1>
          <p>${message}</p>
          <div class="status">Stato: ${newStatus.toUpperCase()}</div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });

  } catch (error) {
    console.error('Errore manage-request route:', error);
    return new NextResponse('Errore server interno.', { status: 500 });
  }
}
