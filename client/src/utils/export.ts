import type { Article } from '../types';
import { calculatePrice, getMarketStats } from './pricing';

function downloadCsv(filename: string, content: string) {
  const BOM = '﻿'; // UTF-8 BOM for Excel
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportWebshopCsv(articles: Article[]): void {
  const headers = [
    'Artikelnummer',
    'EAN',
    'Bezeichnung',
    'Einkaufspreis CHF',
    'VEG CHF',
    'Shopkunden 1-9 CHF',
    'Shopkunden ab 10 CHF',
    'Shopkunden ab 50 CHF',
    'Firmenkunde 1-9 CHF',
    'Firmenkunde ab 10 CHF',
    'Firmenkunde ab 50 CHF',
    'Marktpreis Ø CHF',
    'INOBAT-Nummer',
  ];

  const rows = articles.map(a => {
    const veg = a.vegAmount ?? 0;
    const ws = a.windowPriceCategory.tiers;
    const biz = a.businessPriceCategory.tiers;
    const marketStats = getMarketStats(a.marketPrices);

    return [
      escapeCsv(a.articleNumber),
      escapeCsv(a.ean),
      escapeCsv(a.name),
      escapeCsv(a.purchasePrice.toFixed(2)),
      escapeCsv(veg.toFixed(2)),
      escapeCsv(calculatePrice(a.purchasePrice, ws[0]?.markup ?? 80, veg, true).toFixed(2)),
      escapeCsv(calculatePrice(a.purchasePrice, ws[1]?.markup ?? 65, veg, true).toFixed(2)),
      escapeCsv(calculatePrice(a.purchasePrice, ws[2]?.markup ?? 50, veg, true).toFixed(2)),
      escapeCsv(calculatePrice(a.purchasePrice, biz[0]?.markup ?? 55, veg, true).toFixed(2)),
      escapeCsv(calculatePrice(a.purchasePrice, biz[1]?.markup ?? 40, veg, true).toFixed(2)),
      escapeCsv(calculatePrice(a.purchasePrice, biz[2]?.markup ?? 25, veg, true).toFixed(2)),
      escapeCsv(marketStats ? marketStats.avg.toFixed(2) : ''),
      escapeCsv(a.inobatArticleNumber),
    ].join(';');
  });

  const content = [headers.join(';'), ...rows].join('\n');
  downloadCsv(`contrel-webshop-${new Date().toISOString().slice(0, 10)}.csv`, content);
}

export function exportErpCsv(articles: Article[]): void {
  const headers = [
    'Artikelnummer',
    'EAN',
    'Bezeichnung',
    'Einkaufspreis CHF',
    'VEG CHF',
    'Batterietyp',
    'Gewicht g',
    'Aufschlag Shopkunden T1 %',
    'Aufschlag Shopkunden T2 %',
    'Aufschlag Shopkunden T3 %',
    'Aufschlag Firmenkunde T1 %',
    'Aufschlag Firmenkunde T2 %',
    'Aufschlag Firmenkunde T3 %',
    'INOBAT-Nummer',
  ];

  const rows = articles.map(a => {
    const ws = a.windowPriceCategory.tiers;
    const biz = a.businessPriceCategory.tiers;

    return [
      escapeCsv(a.articleNumber),
      escapeCsv(a.ean),
      escapeCsv(a.name),
      escapeCsv(a.purchasePrice.toFixed(2)),
      escapeCsv((a.vegAmount ?? 0).toFixed(2)),
      escapeCsv(a.batteryType),
      escapeCsv(a.weightGrams ?? ''),
      escapeCsv(ws[0]?.markup ?? 80),
      escapeCsv(ws[1]?.markup ?? 65),
      escapeCsv(ws[2]?.markup ?? 50),
      escapeCsv(biz[0]?.markup ?? 55),
      escapeCsv(biz[1]?.markup ?? 40),
      escapeCsv(biz[2]?.markup ?? 25),
      escapeCsv(a.inobatArticleNumber),
    ].join(';');
  });

  const content = [headers.join(';'), ...rows].join('\n');
  downloadCsv(`contrel-erp-${new Date().toISOString().slice(0, 10)}.csv`, content);
}

export function exportInobatCsv(articles: Article[]): void {
  const month = new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
  const headers = [
    'INOBAT-Artikelnummer',
    'Bezeichnung',
    'Batterietyp',
    'Gewicht g',
    'VEG CHF',
    'Anzahl (Monat)',
    'Total VEG CHF',
  ];

  const rows = articles.map(a => {
    return [
      escapeCsv(a.inobatArticleNumber),
      escapeCsv(a.name),
      escapeCsv(a.batteryType),
      escapeCsv(a.weightGrams ?? ''),
      escapeCsv((a.vegAmount ?? 0).toFixed(2)),
      escapeCsv(''), // Quantity to be filled manually
      escapeCsv(''), // Total to be filled manually
    ].join(';');
  });

  const titleRow = `INOBAT Monatsmeldung ${month}`;
  const content = [titleRow, '', headers.join(';'), ...rows].join('\n');
  downloadCsv(`contrel-inobat-${new Date().toISOString().slice(0, 7)}.csv`, content);
}
