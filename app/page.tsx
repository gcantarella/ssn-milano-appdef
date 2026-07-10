'use client';

import { useState } from 'react';

const pageStyles = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #020617 0%, #0c1326 45%, #111827 100%)',
  color: '#f8fafc',
  padding: '40px 24px',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const cardStyles = {
  background: 'rgba(15, 23, 42, 0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '28px',
  boxShadow: '0 30px 90px rgba(0,0,0,0.35)',
  padding: '32px',
};

const inputStyles = {
  width: '100%',
  padding: '14px 18px',
  borderRadius: '16px',
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(15, 23, 42, 0.95)',
  color: '#f8fafc',
  fontSize: '16px',
  outline: 'none',
};

const buttonStyles = {
  width: '100%',
  padding: '16px 20px',
  borderRadius: '16px',
  border: 'none',
  background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
  color: '#0f172a',
  fontWeight: 700,
  fontSize: '16px',
  cursor: 'pointer',
};

const messageStyles = (success: boolean) => ({
  marginTop: '20px',
  padding: '18px 20px',
  borderRadius: '16px',
  background: success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(248, 113, 113, 0.12)',
  border: `1px solid ${success ? 'rgba(34,197,94,0.2)' : 'rgba(244,63,94,0.2)'}`,
  color: success ? '#d1fae5' : '#fecaca',
});

const resumoStyles = {
  marginTop: '12px',
  color: '#cbd5e1',
  lineHeight: 1.75,
};

export default function Home() {
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!nome.trim() || !cognome.trim()) {
      setMessage('Compila nome e cognome per inviare la richiesta.');
      return;
    }

    setSending(true);
    setMessage('');

    try {
      const response = await fetch('/api/access-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome.trim(),
          cognome: cognome.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        setMessage(`❌ Impossibile inviare la richiesta: ${result.error || 'Errore server'}`);
        return;
      }

      setRequestSent(true);
      setMessage('✅ Richiesta inviata! Verrai autorizzato appena possibile.');
    } catch (err) {
      setMessage(`❌ Errore durante l'invio: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <main style={pageStyles}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gap: '32px' }}>
        <section style={{ ...cardStyles, padding: '40px' }}>
          <div style={{ maxWidth: '720px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px 18px', borderRadius: '999px', background: 'rgba(14, 116, 144, .18)', color: '#7dd3fc', fontWeight: 700, fontSize: '13px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Accesso riservato
            </div>
            <h1 style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)', lineHeight: 1.05, margin: 0, color: '#ffffff' }}>
              Schermata d’accesso SSN Milano
            </h1>
            <p style={resumoStyles}>
              Inserisci il tuo nome e cognome. Dopo l’invio, verrà mandata una mail di autorizzazione a <strong>gestioneiagiovanni@gmail.com</strong>.
            </p>
          </div>
        </section>

        <section style={{ display: 'grid', gap: '24px' }}>
          <div style={{ ...cardStyles, padding: '32px', borderRadius: '28px' }}>
            <h2 style={{ margin: '0 0 16px', color: '#e2e8f0' }}>Richiesta accesso</h2>
            <p style={{ margin: '0 0 24px', color: '#94a3b8' }}>
              Solo nome e cognome sono richiesti. Nessuna email pubblica entra nel form.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
              <label style={{ display: 'grid', gap: '10px', color: '#cbd5e1', fontSize: '14px', fontWeight: 600 }}>
                Nome
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Mario"
                  style={inputStyles}
                />
              </label>

              <label style={{ display: 'grid', gap: '10px', color: '#cbd5e1', fontSize: '14px', fontWeight: 600 }}>
                Cognome
                <input
                  type="text"
                  value={cognome}
                  onChange={(e) => setCognome(e.target.value)}
                  placeholder="Rossi"
                  style={inputStyles}
                />
              </label>

              <button type="submit" disabled={sending || requestSent} style={{ ...buttonStyles, opacity: sending || requestSent ? 0.65 : 1 }}>
                {requestSent ? 'Richiesta inviata' : sending ? 'Invio in corso...' : 'Invia richiesta'}
              </button>
            </form>
            {message && <div style={messageStyles(requestSent)}>{message}</div>}
          </div>

          <div style={{ ...cardStyles, padding: '28px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#f8fafc' }}>Cosa succede</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '14px', color: '#cbd5e1' }}>
              <li style={{ padding: '14px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)' }}><strong>1.</strong> Compili nome e cognome.</li>
              <li style={{ padding: '14px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)' }}><strong>2.</strong> L’app invia una mail di autorizzazione all’amministratore.</li>
              <li style={{ padding: '14px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)' }}><strong>3.</strong> L’amministratore approva manualmente in Supabase.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
