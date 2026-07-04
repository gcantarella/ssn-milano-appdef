'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Correzione per caricare correttamente le icone dei segnaposto in Next.js
const iconaPersonalizzata = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Struttura {
  id: number;
  nome: string;
  indirizzo: string;
  lat: number;
  lon: number;
  distanza_km?: number;
}

interface MappaProps {
  centro: [number, number];
  strutture: Struttura[];
}

// Questa funzione sposta la mappa sul nuovo indirizzo cercato dall'utente
function AggiornaCentro({ centro }: { centro: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(centro, 13);
  }, [centro, map]);
  return null;
}

export default function Mappa({ centro, strutture }: MappaProps) {
  return (
    <MapContainer center={centro} zoom={13} style={{ height: '500px', width: '100%', borderRadius: '8px' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AggiornaCentro centro={centro} />
      
      {/* Segnaposto della posizione cercata dall'utente */}
      <Marker position={centro} icon={iconaPersonalizzata}>
        <Popup>La tua posizione di ricerca</Popup>
      </Marker>

      {/* Segnaposto di tutte le strutture trovate nel raggio */}
      {strutture.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lon]} icon={iconaPersonalizzata}>
          <Popup>
            <strong className="text-black">{s.nome}</strong><br />
            <span className="text-gray-600">{s.indirizzo}</span><br />
            {s.distanza_km && <span className="text-blue-600 font-semibold">Distanza: {s.distanza_km.toFixed(2)} km</span>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}