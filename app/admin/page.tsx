'use client';

import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthorizedUser {
  id: string;
  nome: string;
  cognome: string;
  device_name: string;
  device_id: string;
  approved_at: string;
  created_at: string;
}

interface AccessRequest {
  id: string;
  nome: string;
  cognome: string;
  device_id: string;
  status: string;
  requested_at: string;
}

// ─── Stili ────────────────────────────────────────────────────────────────────

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #020617 0%, #0a1628 50%, #0f172a 100%)',
  color: '#f8fafc',
  fontFamily: 'Inter, system-ui, sans-serif',
  padding: '32px 24px',
};

const card: React.CSSProperties = {
  background: 'rgba(15,23,42,0.9)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '20px',
  padding: '28px',
};

const badge = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 600,
  background: `${color}18`,
  color,
  border: `1px solid ${color}30`,
});

const btnDanger: React.CSSProperties = {
  background: 'rgba(239,68,68,0.12)',
  color: '#fca5a5',
  border: '1px solid rgba(239,68,68,0.2)',
  borderRadius: '8px',
  padding: '6px 14px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
};

const btnSuccess: React.CSSProperties = {
  background: 'rgba(16,185,129,0.12)',
  color: '#6ee7b7',
  border: '1px solid rgba(16,185,129,0.2)',
  borderRadius: '8px',
  padding: '6px 14px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
  marginRight: '8px',
};

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchData = useCallback(async (key: string) => {
    setLoading(true);
    setActionMsg('');
    try {
      const [usersRes, reqRes] = await Promise.all([
        fetch(`/api/admin/list-users?key=${encodeURIComponent(key)}`),
        fetch(`/api/admin/list-requests?key=${encodeURIComponent(key)}`),
      ]);
      if (!usersRes.ok) {
        setAuthError('Chiave admin non valida.');
        setAuthenticated(false);
        return;
      }
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData.requests || []);
      }
    } catch {
      setAuthError('Errore di connessione.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    const res = await fetch(`/api/admin/list-users?key=${encodeURIComponent(adminKey)}`);
    setLoading(false);
    if (!res.ok) {
      setAuthError('Chiave admin non valida. Riprova.');
      return;
    }
    const data = await res.json();
    setUsers(data.users || []);
    setAuthenticated(true);
    // carica anche richieste
    const reqRes = await fetch(`/api/admin/list-requests?key=${encodeURIComponent(adminKey)}`);
    if (reqRes.ok) {
      const reqData = await reqRes.json();
      setRequests(reqData.requests || []);
    }
  };

  const handleDeleteUser = async (userId: string, nome: string) => {
    if (!confirm(`Rimuovere l'autorizzazione di ${nome}?`)) return;
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, adminKey }),
    });
    if (res.ok) {
      setActionMsg(`✅ ${nome} rimosso con successo.`);
      await fetchData(adminKey);
    } else {
      setActionMsg(`❌ Errore durante la rimozione di ${nome}.`);
    }
  };

  const handleManageRequest = async (requestId: string, action: 'approve' | 'reject') => {
    const res = await fetch(`/api/manage-request?id=${requestId}&action=${action}`);
    if (res.ok) {
      setActionMsg(`✅ Richiesta ${action === 'approve' ? 'approvata' : 'rifiutata'}.`);
      await fetchData(adminKey);
    } else {
      setActionMsg(`❌ Errore nella gestione della richiesta.`);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
  };

  // ─── Login ─────────────────────────────────────────────────────────────────

  if (!authenticated) {
    return (
      <main style={{ ...page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...card, maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
          <h1 style={{ fontSize: '22px', margin: '0 0 6px' }}>Pannello Admin</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>SSN Milano — Accesso riservato</p>
          <form onSubmit={handleLogin} style={{ display: 'grid', gap: '14px', textAlign: 'left' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>
              Chiave admin
              <input
                type="password"
                value={adminKey}
                onChange={e => setAdminKey(e.target.value)}
                placeholder="Inserisci la chiave segreta"
                style={{
                  marginTop: '6px', width: '100%', padding: '12px 16px', borderRadius: '12px',
                  border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(15,23,42,0.95)',
                  color: '#f8fafc', fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </label>
            {authError && <p style={{ color: '#fca5a5', fontSize: '13px', margin: 0 }}>⚠️ {authError}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '13px', borderRadius: '12px', border: 'none', background: 'linear-gradient(90deg,#06b6d4,#3b82f6)', color: '#0f172a', fontWeight: 700, fontSize: '15px', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Accesso…' : 'Accedi'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <main style={page}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gap: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '26px', margin: 0 }}>🛡️ Pannello Admin</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '14px' }}>SSN Milano — Gestione accessi</p>
          </div>
          <button onClick={() => fetchData(adminKey)} style={{ ...btnSuccess, padding: '10px 20px' }}>
            🔄 Aggiorna
          </button>
        </div>

        {actionMsg && (
          <div style={{ padding: '14px 20px', borderRadius: '12px', background: actionMsg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: actionMsg.startsWith('✅') ? '#6ee7b7' : '#fca5a5', border: `1px solid ${actionMsg.startsWith('✅') ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`, fontSize: '14px' }}>
            {actionMsg}
          </div>
        )}

        {/* Richieste pendenti */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '17px' }}>📬 Richieste pendenti</h2>
            <span style={badge('#f59e0b')}>{pendingRequests.length} in attesa</span>
          </div>
          {loading ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>Caricamento…</p>
          ) : pendingRequests.length === 0 ? (
            <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>Nessuna richiesta in attesa.</p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {pendingRequests.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: '12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: '#e2e8f0' }}>{r.nome} {r.cognome}</p>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                      {formatDate(r.requested_at)} · Device: <code style={{ fontSize: '11px' }}>{r.device_id?.slice(0, 16)}…</code>
                    </p>
                  </div>
                  <div>
                    <button style={btnSuccess} onClick={() => handleManageRequest(r.id, 'approve')}>✅ Approva</button>
                    <button style={btnDanger} onClick={() => handleManageRequest(r.id, 'reject')}>❌ Rifiuta</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Utenti autorizzati */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '17px' }}>👥 Utenti autorizzati</h2>
            <span style={badge('#10b981')}>{users.length} utenti</span>
          </div>
          {loading ? (
            <p style={{ color: '#64748b', fontSize: '14px' }}>Caricamento…</p>
          ) : users.length === 0 ? (
            <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>Nessun utente autorizzato.</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {users.map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: '#e2e8f0' }}>{u.nome} {u.cognome}</p>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>
                      Approvato {formatDate(u.approved_at)} · {u.device_name || 'Dispositivo sconosciuto'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#475569', fontFamily: 'monospace' }}>
                      {u.device_id}
                    </p>
                  </div>
                  <button style={btnDanger} onClick={() => handleDeleteUser(u.id, `${u.nome} ${u.cognome}`)}>
                    🗑️ Rimuovi
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Storico richieste */}
        {requests.filter(r => r.status !== 'pending').length > 0 && (
          <div style={{ ...card, opacity: 0.8 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '17px' }}>📋 Storico richieste</h2>
            <div style={{ display: 'grid', gap: '8px' }}>
              {requests.filter(r => r.status !== 'pending').map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#94a3b8' }}>{r.nome} {r.cognome} · {formatDate(r.requested_at)}</span>
                  <span style={badge(r.status === 'approved' ? '#10b981' : '#ef4444')}>
                    {r.status === 'approved' ? 'Approvato' : 'Rifiutato'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
