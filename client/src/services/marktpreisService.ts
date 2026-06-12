import type { MarktpreisErgebnis } from '../types';

export async function recherchiereMarktpreise(
  suchbegriff: string,
  ersatztyp?: string,
  aktuellerVkChf?: number,
  eurChfKurs = 0.96,
): Promise<MarktpreisErgebnis> {
  const res = await fetch('/api/market-research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suchbegriff, ersatztyp, aktuellerVkChf, eurChfKurs }),
  });

  const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string } & Partial<MarktpreisErgebnis>;

  if (!res.ok) {
    throw new Error(body.error ?? `Serverfehler ${res.status}`);
  }

  return body as MarktpreisErgebnis;
}
