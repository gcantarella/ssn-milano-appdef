import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const query = new URL(req.url).searchParams.get('q')?.trim();
  if (!query) return NextResponse.json({ error: 'Indirizzo mancante.' }, { status: 400 });

  try {
    const url = new URL('https://photon.komoot.io/api/');
    url.searchParams.set('q', `${query}, Lombardia, Italia`);
    url.searchParams.set('limit', '1');
    const response = await fetch(url, { next: { revalidate: 86400 } });
    const data = await response.json() as { features?: Array<{ geometry?: { coordinates?: [number, number] } }> };
    const coordinates = data.features?.[0]?.geometry?.coordinates;
    const match = coordinates && { lat: coordinates[1], lon: coordinates[0] };
    if (!match) return NextResponse.json({ error: 'Localita non trovata.' }, { status: 404 });
    return NextResponse.json(match);
  } catch {
    return NextResponse.json({ error: 'Servizio di geolocalizzazione non disponibile.' }, { status: 502 });
  }
}
