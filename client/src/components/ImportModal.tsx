import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Article } from '../types';
import { createDefaultArticle } from '../types';
import { calculateVeg } from '../utils/veg';
import type { BatteryType } from '../types';

interface ImportModalProps {
  onClose: () => void;
  onImport: (articles: Article[]) => void;
}

interface ParsedRow {
  name: string;
  articleNumber: string;
  ean: string;
  purchasePrice: number;
  batteryType: string;
  weightGrams: number | null;
  markupW1: number;
  markupW2: number;
  markupW3: number;
  markupB1: number;
  markupB2: number;
  markupB3: number;
  valid: boolean;
  error: string;
}

const BATTERY_TYPE_MAP: Record<string, BatteryType> = {
  'kohle-zink': 'kohle-zink-standard',
  'kohle-zink-standard': 'kohle-zink-standard',
  'alkali': 'alkali-standard',
  'alkali-standard': 'alkali-standard',
  'knopfzelle': 'knopfzelle',
  'lithium-primaer': 'lithium-primaer',
  'lithium-primär': 'lithium-primaer',
  'nicd': 'nicd-standard',
  'nicd-standard': 'nicd-standard',
  'nimh': 'nimh-standard',
  'nimh-standard': 'nimh-standard',
  'liion-geraet': 'liion-geraet',
  'li-ion gerät': 'liion-geraet',
  'liion-industrie': 'liion-industrie',
  'li-ion industrie': 'liion-industrie',
  'lifepo4': 'lifepo4-industrie',
  'lifepo4-industrie': 'lifepo4-industrie',
  'blei-klein': 'blei-klein',
  'blei-gross': 'blei-gross',
  'blei-groß': 'blei-gross',
  'ebike': 'ebike-liion',
  'ebike-liion': 'ebike-liion',
  'e-bike': 'ebike-liion',
  'blei-fahrzeug': 'blei-fahrzeug',
  'lithium-fahrzeug': 'lithium-fahrzeug',
};

function parseCsv(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  return lines
    .filter(line => line.trim().length > 0)
    .map(line => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if ((ch === ';' || ch === ',') && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      result.push(current.trim());
      return result;
    });
}

function parseRow(cols: string[], headers: string[]): ParsedRow {
  const get = (name: string): string => {
    const idx = headers.findIndex(h =>
      h.toLowerCase().replace(/\s+/g, '').includes(name.toLowerCase().replace(/\s+/g, ''))
    );
    return idx >= 0 ? (cols[idx] ?? '').trim() : '';
  };

  const baseName = get('bezeichnung') || get('name') || get('artikel');
  const zusatz = get('zusatzbezeichnung') || get('zusatz');
  const name = zusatz ? `${baseName} · ${zusatz}` : baseName;
  const articleNumber = get('artikelnummer') || get('artikel-nr') || get('artnr') || get('art.nr') || get('art-nr') || get('nummer');
  const ean = get('ean');
  const priceRaw = get('einkaufspreis') || get('ek-preis') || get('ekpreis') || get('preis');
  const purchasePrice = parseFloat(priceRaw.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
  const batteryTypeRaw = (get('batterietyp') || get('typ') || '').toLowerCase().trim();
  const weightRaw = get('gewicht') || get('gramm') || get('g');
  const weightGrams = weightRaw ? parseFloat(weightRaw.replace(',', '.')) || null : null;

  const batteryType = BATTERY_TYPE_MAP[batteryTypeRaw] || '';

  const getNum = (key: string, fallback: number) => {
    const val = get(key);
    if (!val) return fallback;
    const n = parseFloat(val.replace(',', '.'));
    return isNaN(n) ? fallback : n;
  };

  const markupW1 = getNum('schaufenster1') || getNum('sw1') || getNum('aufschlagschaufenster1') || 80;
  const markupW2 = getNum('schaufenster2') || getNum('sw2') || 65;
  const markupW3 = getNum('schaufenster3') || getNum('sw3') || 50;
  const markupB1 = getNum('firmenkunde1') || getNum('fk1') || 55;
  const markupB2 = getNum('firmenkunde2') || getNum('fk2') || 40;
  const markupB3 = getNum('firmenkunde3') || getNum('fk3') || 25;

  const valid = name.length > 0;
  const error = !name ? 'Bezeichnung fehlt' : '';

  return { name, articleNumber, ean, purchasePrice, batteryType, weightGrams, markupW1, markupW2, markupW3, markupB1, markupB2, markupB3, valid, error };
}

function rowToArticle(row: ParsedRow): Article {
  const art = createDefaultArticle();
  art.name = row.name;
  art.articleNumber = row.articleNumber;
  art.ean = row.ean;
  art.purchasePrice = row.purchasePrice;
  art.batteryType = row.batteryType as BatteryType | '';
  art.weightGrams = row.weightGrams;
  art.windowPriceCategory.tiers[0].markup = row.markupW1;
  art.windowPriceCategory.tiers[1].markup = row.markupW2;
  art.windowPriceCategory.tiers[2].markup = row.markupW3;
  art.businessPriceCategory.tiers[0].markup = row.markupB1;
  art.businessPriceCategory.tiers[1].markup = row.markupB2;
  art.businessPriceCategory.tiers[2].markup = row.markupB3;

  if (row.batteryType) {
    const vegResult = calculateVeg(row.batteryType as BatteryType, row.weightGrams);
    art.vegAmount = vegResult.veg;
    art.inobatArticleNumber = vegResult.inobatArticleNumber;
  }

  return art;
}

function downloadTemplate() {
  const BOM = '﻿';
  const header = 'Bezeichnung;Artikelnummer;EAN;Einkaufspreis;Batterietyp;Gewicht (g);Shopkunden T1 %;Shopkunden T2 %;Shopkunden T3 %;Firmenkunde T1 %;Firmenkunde T2 %;Firmenkunde T3 %';
  const example1 = 'Panasonic AA Alkaline 4er;BAT-001;4006381333931;1.20;alkali-standard;;80;65;50;55;40;25';
  const example2 = 'Samsung INR21700 Li-Ion;BAT-002;8806090459702;8.50;liion-geraet;70;80;65;50;55;40;25';
  const example3 = 'VARTA Blei Fahrzeugbatterie 12V;BAT-003;;45.00;blei-fahrzeug;8500;80;65;50;55;40;25';
  const content = [header, example1, example2, example3].join('\n');
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contrel-import-vorlage.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parsed, setParsed] = useState(false);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const allRows = parseCsv(text);
      if (allRows.length < 2) return;
      const headers = allRows[0];
      const dataRows = allRows.slice(1).map(cols => parseRow(cols, headers));
      setRows(dataRows);
      setParsed(true);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const validRows = rows.filter(r => r.valid);
  const invalidRows = rows.filter(r => !r.valid);

  const handleImport = () => {
    const articles = validRows.map(rowToArticle);
    onImport(articles);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Artikel importieren</h2>
            <p className="text-sm text-gray-500">CSV-Datei aus Excel hochladen</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {!parsed ? (
            <div className="space-y-4">
              {/* Template download */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Vorlage verwenden</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Lade die CSV-Vorlage herunter, fülle sie in Excel aus und speichere als CSV (Semikolon-getrennt).
                  </p>
                  <button onClick={downloadTemplate} className="mt-2 text-xs font-medium text-blue-700 underline hover:text-blue-900">
                    CSV-Vorlage herunterladen →
                  </button>
                </div>
              </div>

              {/* Spalten-Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Erwartete Spalten (Reihenfolge egal)</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                  <div><span className="font-medium text-red-600">Bezeichnung *</span> — Produktname (Pflicht)</div>
                  <div><span className="font-medium">Einkaufspreis</span> — z.B. 1.20 (optional, nachträglich erfassbar)</div>
                  <div><span className="font-medium">Artikelnummer</span> — optional</div>
                  <div><span className="font-medium">EAN</span> — optional</div>
                  <div><span className="font-medium">Batterietyp</span> — z.B. alkali-standard</div>
                  <div><span className="font-medium">Gewicht (g)</span> — in Gramm</div>
                  <div><span className="font-medium">Shopkunden T1–T3 %</span> — Aufschläge</div>
                  <div><span className="font-medium">Firmenkunde T1–T3 %</span> — Aufschläge</div>
                </div>
                <p className="text-xs text-gray-400 mt-2">* Nur Bezeichnung ist Pflicht. Batterietypen: alkali-standard, kohle-zink-standard, liion-geraet, lifepo4-industrie, blei-fahrzeug, etc.</p>
              </div>

              {/* Dropzone */}
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium text-gray-700">CSV-Datei hierher ziehen</p>
                <p className="text-xs text-gray-400 mt-1">oder klicken zum Auswählen</p>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              </div>

              <div className="text-xs text-gray-400 text-center">
                In Excel: <strong>Datei → Speichern unter → CSV UTF-8 (durch Trennzeichen getrennt)</strong>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{fileName}</p>
                  <p className="text-sm text-gray-500">
                    <span className="text-green-600 font-medium">{validRows.length} gültige Artikel</span>
                    {invalidRows.length > 0 && <span className="text-red-500 ml-2">{invalidRows.length} ungültig</span>}
                  </p>
                </div>
                <button onClick={() => { setParsed(false); setRows([]); setFileName(''); }} className="btn-ghost text-sm">
                  Andere Datei
                </button>
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">#</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Bezeichnung</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Art.-Nr.</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">EK CHF</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Batterietyp</th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-600">Gewicht g</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className={`border-b border-gray-100 ${row.valid ? '' : 'bg-red-50'}`}>
                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{row.name || <span className="text-red-400 italic">leer</span>}</td>
                        <td className="px-3 py-2 text-gray-500">{row.articleNumber || '—'}</td>
                        <td className="px-3 py-2 text-right font-mono">{row.purchasePrice > 0 ? row.purchasePrice.toFixed(2) : <span className="text-gray-300">—</span>}</td>
                        <td className="px-3 py-2 text-gray-500">{row.batteryType || '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{row.weightGrams ?? '—'}</td>
                        <td className="px-3 py-2 text-center">
                          {row.valid
                            ? <span className="text-green-600">✓</span>
                            : <span className="text-red-500" title={row.error}>✗ {row.error}</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="btn-secondary">Abbrechen</button>
          {parsed && validRows.length > 0 && (
            <button onClick={handleImport} className="btn-primary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {validRows.length} Artikel importieren
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
