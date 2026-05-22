export function roundToFiveCents(value: number): number {
  return Math.round(value * 20) / 20;
}

export function formatCHF(value: number): string {
  return value.toLocaleString('de-CH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value: number): string {
  return value.toFixed(1) + '%';
}
