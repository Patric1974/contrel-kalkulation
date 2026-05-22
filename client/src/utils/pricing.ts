import type { MarketPrice } from '../types';

export function roundToFiveCents(value: number): number {
  return Math.round(value * 20) / 20;
}

export function calculatePrice(
  purchasePrice: number,
  markupPercent: number,
  veg: number | null,
  includeVeg: boolean
): number {
  const vegAmount = includeVeg && veg !== null ? veg : 0;
  const base = purchasePrice * (1 + markupPercent / 100);
  return roundToFiveCents(base + vegAmount);
}

export function calculateMargin(purchasePrice: number, sellingPrice: number): number {
  if (sellingPrice <= 0) return 0;
  return ((sellingPrice - purchasePrice) / sellingPrice) * 100;
}

export interface MarketStats {
  avg: number;
  min: number;
  max: number;
}

export function getMarketStats(prices: MarketPrice[]): MarketStats | null {
  if (prices.length === 0) return null;
  const values = prices.map(p => p.price).filter(p => p > 0);
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    avg: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

export type PriceSignal = 'green' | 'yellow' | 'red';

export function getPriceSignal(price: number, marketAvg: number): PriceSignal {
  if (price <= marketAvg) return 'green';
  if (price <= marketAvg * 1.1) return 'yellow';
  return 'red';
}
