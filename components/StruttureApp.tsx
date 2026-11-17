'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const Mappa = dynamic(() => import('./Mappa'), { ssr: false });

type Struttura = {
  id: number;
  nome: string;
  indirizzo: string;
  citta: string;
  zona: string | null;
  municipio: string | null;
  metro: string | null;
  asst: string | null;
  lat: number;
  lon: number;
  distanza_km?: number;
};

type Props = { nome: string; onLogout: () => void };

const milano: [number, number] = [45.4642, 9.19];

function distanzaKm(a: [number, number], b: [number, number]) {
  const r = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function StruttureApp({ nome, onLogout }: Props) {
  const [strutture, setStrutture] = useState<Struttura[]>([]);
  const [risultati, setRisultati] = useState<Struttura[]>([]);
  const [query, setQuery] = useState('');
  const [raggio, setRaggio] = useState(5);
  const [centro, setCentro] = useState<[number, number]>(milano);
  const [caricamento, setCaricamento] = useState(true);
  const [ricercaEseguita, setRicercaEseguita] = useState(false);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    async function carica() {
      if (!supabase) {
        setErrore('Configurazione Supabase non disponibile.');
        setCaricamento(false);
        return;
      }
      const { data, error } = await supabase
        .from('strutture')
        .select('id, nome, indirizzo, citta, zona, municipio, metro, asst, lat, lon')
        .not('lat', 'is', null)
        .not('lon', 'is', null)
        .order('nome');
      if (error) setErrore('Impossibile caricare le strutture sanitarie.');
      else setStrutture((data || []) as Struttura[]);
      setCaricamento(false);
    }
    void carica();
  }, []);

  const descrizione = useMemo(() => `${risultati.length} struttur${risultati.length === 1 ? 'a trovata' : 'e trovate'}`, [risultati.length]);

  async function cerca() {
    const testo = query.trim();
    setErrore('');
    setRicercaEseguita(true);
    if (!testo) {
      setRisultati([]);
      return;
    }

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(testo)}`);
      const geo = await res.json();
      if (res.ok && typeof geo.lat === 'number' && typeof geo.lon === 'number') {
        const nuovoCentro: [number, number] = [geo.lat, geo.lon];
        setCentro(nuovoCentro);
        setRisultati(strutture
          .map(s => ({ ...s, distanza_km: distanzaKm(nuovoCentro, [s.lat, s.lon]) }))
          .filter(s => s.distanza_km! <= raggio)
          .sort((a, b) => a.distanza_km! - b.distanza_km!));
        return;
      }
    } catch {
      // Usa la ricerca testuale locale qui sotto.
    }

    const normalizzato = testo.toLocaleLowerCase('it-IT');
    const trovate = strutture.filter(s => [s.nome, s.indirizzo, s.citta, s.zona, s.metro, s.asst]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('it-IT')
      .includes(normalizzato));
    setRisultati(trovate);
    if (!trovate.length) setErrore('Indirizzo o zona non trovati. Prova ad esempio “Via Montenapoleone” o “Sesto Rondò”.');
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f6f8fc', color: '#14213d', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e7ebf2', padding: '22px 30px', display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <span style={{ background: '#009d6b', color: 'white', borderRadius: 8, padding: '5px 10px', fontWeight: 800, fontSize: 12 }}>SSN MILANO</span>
            <span style={{ background: '#edf3ff', color: '#637694', borderRadius: 8, padding: '5px 10px', fontWeight: 700, fontSize: 12 }}>Regione Lombardia</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem, 3vw, 2.3rem)' }}>🗺️ Cerca Strutture Sanitarie</h1>
          <p style={{ color: '#657a9d', margin: '8px 0 0' }}>Localizza ospedali, poliambulatori e presidi del Servizio Sanitario Nazionale vicino a te.</p>
        </div>
        <button onClick={onLogout} style={{ border: '1px solid #ccd6e5', background: 'white', borderRadius: 9, padding: '9px 13px', color: '#415471', cursor: 'pointer' }}>Esci ({nome})</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 42%) 1fr', minHeight: 'calc(100vh - 146px)' }}>
        <section style={{ background: 'white', borderRight: '1px solid #e7ebf2' }}>
          <form onSubmit={event => { event.preventDefault(); void cerca(); }} style={{ padding: 30, borderBottom: '1px solid #e7ebf2' }}>
            <label style={{ display: 'grid', gap: 9, color: '#3d4e68', fontSize: 14, fontWeight: 800 }}>
              INSERISCI INDIRIZZO O ZONA:
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Es: Via Montenapoleone" style={{ border: '1px solid #d7e0eb', background: '#f9fbfd', borderRadius: 15, padding: '16px 18px', fontSize: 16, color: '#14213d' }} />
            </label>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, fontWeight: 800, color: '#3d4e68', fontSize: 14 }}><span>RAGGIO DI RICERCA:</span><span style={{ background: '#e7fbf2', color: '#009d6b', borderRadius: 6, padding: '5px 10px' }}>{raggio} KM</span></div>
            <input aria-label="Raggio di ricerca" type="range" min="1" max="30" value={raggio} onChange={e => setRaggio(Number(e.target.value))} style={{ width: '100%', margin: '18px 0 8px', accentColor: '#009d6b' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#91a4c1' }}><span>1 km</span><span>15 km</span><span>30 km</span></div>
            <button disabled={caricamento} type="submit" style={{ width: '100%', marginTop: 24, background: '#009d6b', color: 'white', border: 0, borderRadius: 15, padding: 17, fontWeight: 800, fontSize: 16, cursor: 'pointer', opacity: caricamento ? .65 : 1 }}>{caricamento ? 'Caricamento strutture…' : 'Trova Strutture'}</button>
          </form>
          <div style={{ padding: 30 }}>
            {!ricercaEseguita ? <div style={{ textAlign: 'center', color: '#6b7f9f', padding: '70px 10px' }}><div style={{ fontSize: 48 }}>🏥</div><h2 style={{ fontSize: 18 }}>Nessuna ricerca effettuata</h2><p>Inserisci un indirizzo per cercare le strutture del SSN limitrofe.</p></div> : <>
              <h2 style={{ marginTop: 0, fontSize: 18 }}>{descrizione}</h2>
              {errore && <p style={{ color: '#b42318', lineHeight: 1.5 }}>{errore}</p>}
              <div style={{ display: 'grid', gap: 12, maxHeight: '52vh', overflowY: 'auto', paddingRight: 3 }}>{risultati.map(s => <article key={s.id} style={{ border: '1px solid #e0e7f0', borderRadius: 12, padding: 14 }}><strong>{s.nome}</strong><p style={{ margin: '7px 0', color: '#5f7291', fontSize: 14 }}>{s.indirizzo}, {s.citta}</p><small style={{ color: '#009d6b', fontWeight: 800 }}>{s.distanza_km !== undefined ? `${s.distanza_km.toFixed(1)} km` : (s.metro || s.zona || 'Struttura SSN')}</small></article>)}</div>
            </>}
          </div>
        </section>
        <section style={{ padding: 22, minWidth: 0 }}>
          <Mappa centro={centro} strutture={risultati} />
        </section>
      </div>
    </main>
  );
}
