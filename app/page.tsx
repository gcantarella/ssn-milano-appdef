'use client';

import { useEffect, useState, useCallback } from 'react';

// ─── Stili ───────────────────────────────────────────────────────────────────

const pageStyles: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #020617 0%, #0c1326 45%, #111827 100%)',
  color: '#f8fafc',
  padding: '40px 24px',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const cardStyles: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '28px',
  boxShadow: '0 30px 90px rgba(0,0,0,0.35)',
  padding: '32px',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '14px 18px',
  borderRadius: '16px',
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'rgba(15, 23, 42, 0.95)',
  color: '#f8fafc',
  fontSize: '16px',
  outline: 'none',
  boxSizing: 'border-box',
};

const buttonStyles: React.CSSProperties = {
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

const messageStyles = (success: boolean): React.CSSProperties => ({
  marginTop: '20px',
  padding: '18px 20px',
  borderRadius: '16px',
  background: success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(248, 113, 113, 0.12)',
  border: `1px solid ${success ? 'rgba(34,197,94,0.2)' : 'rgba(244,63,94,0.2)'}`,
  color: success ? '#d1fae5' : '#fecaca',
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('ssn_device_id');
  if (!id) {
    id = `dev_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem('ssn_device_id', id);
  }
  return id;
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function Home() {
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [wrongDevice, setWrongDevice] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Inizializzazione lato client: ripristina da localStorage
  useEffect(() => {
    const id = getOrCreateDeviceId();
    setDeviceId(id);

    const savedNome = localStorage.getItem('ssn_nome') || '';
    const savedCognome = localStorage.getItem('ssn_cognome') || '';
    const savedSent = localStorage.getItem('ssn_request_sent') === 'true';

    if (savedNome) setNome(savedNome);
    if (savedCognome) setCognome(savedCognome);
    if (savedSent) {
      setRequestSent(true);
      setMessage('⏳ Richiesta inviata. In attesa di approvazione…');
    }

    setHydrated(true);
  }, []);

  // Polling: controlla lo stato di accesso ogni 5 secondi
  const checkAccess = useCallback(async (n: string, c: string, d: string) => {
    if (!n || !c || !d) return;
    try {
      const res = await fetch('/api/check-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: n, cognome: c, deviceId: d }),
      });
      const result = await res.json();
      if (!res.ok || result.error) return;

      if (result.approved) {
        setAccessGranted(true);
        setWrongDevice(false);
        setMessage('✅ Accesso approvato. Benvenuto!');
      } else if (result.reason === 'wrong_device') {
        setWrongDevice(true);
        setAccessGranted(false);
        setMessage('⛔ Questo dispositivo non è autorizzato. L\'accesso è consentito solo dal dispositivo originale.');
      }
    } catch {
      // silenzioso, riprova al prossimo tick
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !requestSent || accessGranted) return;
    void checkAccess(nome, cognome, deviceId);
    const interval = setInterval(() => void checkAccess(nome, cognome, deviceId), 5000);
    return () => clearInterval(interval);
  }, [hydrated, requestSent, accessGranted, nome, cognome, deviceId, checkAccess]);

  // Invio richiesta
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nome.trim() || !cognome.trim()) {
      setMessage('Compila nome e cognome per inviare la richiesta.');
      return;
    }
    setSending(true);
    setMessage('');
    try {
      const res = await fetch('/api/access-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim(), cognome: cognome.trim(), deviceId }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        setMessage(`❌ ${result.error || 'Errore server'}`);
        return;
      }
      // Persisti in localStorage per sopravvivere ai refresh
      localStorage.setItem('ssn_nome', nome.trim());
      localStorage.setItem('ssn_cognome', cognome.trim());
      localStorage.setItem('ssn_request_sent', 'true');

      setRequestSent(true);
      setAccessGranted(false);

      if (result.alreadyExists && result.status === 'approved') {
        setAccessGranted(true);
        setMessage('✅ Accesso già approvato. Benvenuto!');
      } else if (result.alreadyExists) {
        setMessage('⏳ Richiesta già inviata. In attesa di approvazione…');
      } else {
        setMessage('✅ Richiesta inviata! Verrai autorizzato appena possibile.');
      }
    } catch (err) {
      setMessage(`❌ Errore durante l'invio: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`);
    } finally {
      setSending(false);
    }
  };

  // Reset (per cambiare utente)
  const handleReset = () => {
    localStorage.removeItem('ssn_nome');
    localStorage.removeItem('ssn_cognome');
    localStorage.removeItem('ssn_request_sent');
    setNome('');
    setCognome('');
    setMessage('');
    setRequestSent(false);
    setAccessGranted(false);
    setWrongDevice(false);
  };

  if (!hydrated) return null;

  return (
    <main style={pageStyles}>
      <div style={{ maxWidth: '860px', margin: '0 auto', display: 'grid', gap: '28px' }}>

        {/* Header */}
        <section style={{ ...cardStyles, padding: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '18px', padding: '10px 16px', borderRadius: '999px', background: 'rgba(14,116,144,.18)', color: '#7dd3fc', fontWeight: 700, fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            🔐 Accesso riservato
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1.08, margin: 0, color: '#ffffff' }}>
            Schermata d'accesso<br />SSN Milano
          </h1>
          <p style={{ marginTop: '14px', color: '#cbd5e1', lineHeight: 1.75 }}>
            Inserisci il tuo nome e cognome. Una mail di autorizzazione verrà inviata all'amministratore.
          </p>
        </section>

        {/* Form / Stato */}
        <section style={{ display: 'grid', gap: '20px' }}>
          <div style={{ ...cardStyles, padding: '32px' }}>

            {accessGranted ? (
              // ─── Pannello accesso consentito ───
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
                <h2 style={{ color: '#d1fae5', margin: '0 0 10px' }}>Accesso consentito</h2>
                <p style={{ color: '#a7f3d0', marginBottom: '24px', lineHeight: 1.7 }}>
                  Benvenuto, <strong>{nome} {cognome}</strong>.<br />
                  L'approvazione è stata ricevuta su questo dispositivo.
                </p>
                <div style={{ ...cardStyles, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '16px', padding: '20px', textAlign: 'left', marginBottom: '20px' }}>
                  <p style={{ margin: 0, color: '#6ee7b7', fontSize: '14px', lineHeight: 1.7 }}>
                    🗺️ L'applicazione SSN Milano è ora disponibile.<br />
                    Questa sessione è legata a <strong>questo dispositivo</strong>. Accedere da un altro browser o dispositivo non sarà possibile.
                  </p>
                </div>
                <button onClick={handleReset} style={{ ...buttonStyles, background: 'rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '14px', padding: '12px 20px', width: 'auto' }}>
                  Cambia utente
                </button>
              </div>
            ) : (
              // ─── Form di richiesta ───
              <>
                <h2 style={{ margin: '0 0 8px', color: '#e2e8f0' }}>Richiesta accesso</h2>
                <p style={{ margin: '0 0 24px', color: '#94a3b8', fontSize: '14px' }}>
                  Solo nome e cognome. Nessuna email pubblica nel form.
                </p>

                {!requestSent ? (
                  <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
                    <label style={{ display: 'grid', gap: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: 600 }}>
                      Nome
                      <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Mario" style={inputStyles} />
                    </label>
                    <label style={{ display: 'grid', gap: '8px', color: '#cbd5e1', fontSize: '14px', fontWeight: 600 }}>
                      Cognome
                      <input type="text" value={cognome} onChange={e => setCognome(e.target.value)} placeholder="Rossi" style={inputStyles} />
                    </label>
                    <button type="submit" disabled={sending} style={{ ...buttonStyles, opacity: sending ? 0.65 : 1 }}>
                      {sending ? '⏳ Invio in corso…' : 'Invia richiesta'}
                    </button>
                  </form>
                ) : (
                  // ─── In attesa ───
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    {wrongDevice ? (
                      <>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>⛔</div>
                        <h3 style={{ color: '#fca5a5', margin: '0 0 10px' }}>Dispositivo non autorizzato</h3>
                        <p style={{ color: '#fca5a5', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px' }}>
                          L'accesso per <strong>{nome} {cognome}</strong> è stato approvato su un altro dispositivo.<br />
                          Non è possibile accedere da qui.
                        </p>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: '48px', marginBottom: '12px', animation: 'pulse 2s infinite' }}>⏳</div>
                        <h3 style={{ color: '#e2e8f0', margin: '0 0 10px' }}>In attesa di approvazione</h3>
                        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px' }}>
                          La richiesta per <strong>{nome} {cognome}</strong> è stata inviata.<br />
                          Questa pagina si aggiornerà automaticamente appena riceverai l'approvazione.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#6ee7b7', fontSize: '13px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }}></span>
                          Controllo automatico ogni 5 secondi…
                        </div>
                      </>
                    )}
                    <button onClick={handleReset} style={{ ...buttonStyles, background: 'rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: '13px', padding: '10px 20px', width: 'auto', marginTop: '20px' }}>
                      ← Ricomincia
                    </button>
                  </div>
                )}

                {message && !requestSent && (
                  <div style={messageStyles(requestSent)}>{message}</div>
                )}
              </>
            )}
          </div>

          {/* Blocco info */}
          {!accessGranted && (
            <div style={{ ...cardStyles, padding: '24px' }}>
              <h3 style={{ margin: '0 0 14px', color: '#f8fafc', fontSize: '15px' }}>Come funziona</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', color: '#94a3b8', fontSize: '14px' }}>
                <li style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                  <strong style={{ color: '#cbd5e1' }}>1.</strong> Compili nome e cognome e invii la richiesta.
                </li>
                <li style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                  <strong style={{ color: '#cbd5e1' }}>2.</strong> L'amministratore riceve una mail con i pulsanti Approva / Rifiuta.
                </li>
                <li style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                  <strong style={{ color: '#cbd5e1' }}>3.</strong> Questa pagina si aggiorna automaticamente appena sei autorizzato.
                </li>
                <li style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                  <strong style={{ color: '#cbd5e1' }}>4.</strong> L'accesso è vincolato a <strong style={{ color: '#7dd3fc' }}>questo dispositivo</strong>.
                </li>
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
