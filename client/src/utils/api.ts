import type { Calculation, CalculationSummary } from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function listCalculations(): Promise<CalculationSummary[]> {
  const res = await fetch(`${API_BASE}/calculations`);
  return handleResponse<CalculationSummary[]>(res);
}

export async function getCalculation(id: string): Promise<Calculation> {
  const res = await fetch(`${API_BASE}/calculations/${id}`);
  return handleResponse<Calculation>(res);
}

export async function getSharedCalculation(id: string): Promise<Calculation> {
  const res = await fetch(`/share/${id}`);
  return handleResponse<Calculation>(res);
}

export async function createCalculation(
  name: string,
  sessionId: string,
  articles: unknown[] = []
): Promise<Calculation> {
  const res = await fetch(`${API_BASE}/calculations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, session_id: sessionId, articles }),
  });
  return handleResponse<Calculation>(res);
}

export async function updateCalculation(
  id: string,
  sessionId: string,
  data: { name?: string; articles?: unknown[] }
): Promise<Calculation> {
  const res = await fetch(`${API_BASE}/calculations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, ...data }),
  });
  return handleResponse<Calculation>(res);
}

export async function deleteCalculation(id: string, sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/calculations/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
  return handleResponse<void>(res);
}
