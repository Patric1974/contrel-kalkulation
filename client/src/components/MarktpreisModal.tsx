import React, { useState } from 'react';
import type { AmpelStatus, MarktpreisErgebnis } from '../types';
import { ANBIETER_NAMEN_LOADING } from '../config/marktpreisAnbieter';
import { recherchiereMarktpreise } from '../services/marktpreisService';

interface MarktpreisModalProps {
  articleName: string;
  articleNumber: string;
  currentVkChf?: number;
  marktpreis?: MarktpreisErgebnis;
  onSave: (ergebnis: MarktpreisErgebnis) => void;
  onClose: () => void;
}

type ModalState = 'eingabe' | 'laden' | 'ergebnis' | 'fehler';

const AMPEL_CONFIG: Record<AmpelStatus, { label: string; textColor: string; bg: string; border: string; dotColor: string }> = {
  gruen: { label: 'Günstig / Marktkonform', textColor: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', dotColor: 'bg-green-500' },
  gelb: { label: 'Leicht über Marktpreis', textColor: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', dotColor: 'bg-yellow-500' },
  rot: { label: 'Deutlich über Marktpreis', textColor: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dotColor: 'bg-red-500' },
  unbekannt: { label: 'Nicht bestimmbar', textColor: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', dotColor: 'bg-gray-400' },
};

export function MarktpreisModal({
  articleName,
  articleNumber,
  currentVkChf,
  marktpreis,
  onSave,
  onClose,
}: MarktpreisModalProps) {
  const [state, setState] = useState<ModalState>(marktpreis ? 'ergebnis' : 'eingabe');
  const [suchbegriff, setSuchbegriff] = useState(articleNumber || articleName || '');
  const [ersatztyp, setErsatztyp] = useState('');
  const [eurChfKurs, setEurChfKurs] = useState(0.96);
  const [ergebnis, setErgebnis] = useState<MarktpreisErgebnis | null>(marktpreis ?? null);
  const [fehler, setFehler] = useState('');
  const [showAnbieter, setShowAnbieter] = useState(false);

  const recherchieren = async () => {
    if (!suchbegriff.trim()) return;
    setState('laden');
    setFehler('');
    try {
      const result = await recherchiereMarktpreise(
        suchbegriff.trim(),
        ersatztyp.trim() || undefined,
        currentVkChf,
        eurChfKurs,
      );
      setErgebnis(result);
      setShowAnbieter(false);
      setState('ergebnis');
    } catch (err: unknown) {
      setFehler(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setState('fehler');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-900 to-blue-700 text-white flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347A3.001 3.001 0 0112 15a3 3 0 01-2.12-5.12l.243-.243" />
              </svg>
              KI-Marktpreisrecherche
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">Analysiert Schweizer und deutsche Online-Händler via Claude AI</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={state === 'laden'}
            className="text-blue-200 hover:text-white transition-colors disabled:opacity-40"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* EINGABE / FEHLER */}
          {(state === 'eingabe' || state === 'fehler') && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Suchbegriff <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={suchbegriff}
                  onChange={e => setSuchbegriff(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && recherchieren()}
                  placeholder="z.B. Panasonic LC-R127R2PG 12V 7.2Ah"
                  className="input-field"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">Artikelnummer, vollständige Bezeichnung oder Produkttyp</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alternative / Ersatztyp{' '}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={ersatztyp}
                  onChange={e => setErsatztyp(e.target.value)}
                  placeholder="z.B. 12V 7Ah Blei-Akku kompatibel"
                  className="input-field"
                />
              </div>

              <div className="flex items-start gap-4">
                <div className="w-40">
                  <label className="block text-sm font-medium text-gray-700 mb-1">EUR/CHF Kurs</label>
                  <input
                    type="number"
                    value={eurChfKurs}
                    onChange={e => setEurChfKurs(parseFloat(e.target.value) || 0.96)}
                    step="0.01"
                    min="0.5"
                    max="2"
                    className="input-field"
                  />
                </div>
                {currentVkChf !== undefined && currentVkChf > 0 && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aktueller Contrel VK</label>
                    <div className="input-field bg-gray-50 text-gray-600 font-mono">
                      CHF {currentVkChf.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {state === 'fehler' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <strong>Fehler:</strong> {fehler}
                </div>
              )}
            </div>
          )}

          {/* LADEN */}
          {state === 'laden' && (
            <div className="p-8 flex flex-col items-center justify-center gap-6 min-h-[280px]">
              <div className="w-14 h-14 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600" />
              <div className="text-center space-y-2">
                <p className="text-base font-semibold text-gray-800">Marktpreise werden recherchiert…</p>
                <p className="text-sm text-gray-500">Durchsuche Schweizer und deutsche Online-Händler</p>
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  {ANBIETER_NAMEN_LOADING.map((name, i) => (
                    <span
                      key={name}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 150}ms` }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ERGEBNIS */}
          {state === 'ergebnis' && ergebnis && (
            <div className="p-6 space-y-5">
              {/* Stat-Karten */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Tiefstpreis', value: ergebnis.tiefstpreis_chf, extra: '' },
                  { label: 'Marktpreis', value: ergebnis.marktpreis_chf, extra: 'ring-1 ring-blue-300 bg-blue-50' },
                  { label: 'Premiumpreis', value: ergebnis.premiumpreis_chf, extra: '' },
                  { label: 'Empfehlung VK', value: ergebnis.empfehlung_vk_chf, extra: 'ring-1 ring-green-300 bg-green-50' },
                ].map(card => (
                  <div
                    key={card.label}
                    className={`rounded-xl border border-gray-200 p-3 text-center ${card.extra}`}
                  >
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{card.label}</div>
                    <div className="text-lg font-bold text-gray-900 mt-1">
                      {card.value !== null && card.value !== undefined
                        ? `CHF ${card.value.toFixed(2)}`
                        : <span className="text-gray-300 font-normal text-sm">—</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ampel */}
              {(() => {
                const conf = AMPEL_CONFIG[ergebnis.ampel];
                return (
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${conf.bg} ${conf.border}`}>
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 ${conf.dotColor}`} />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-semibold ${conf.textColor}`}>{conf.label}</span>
                      {currentVkChf && ergebnis.marktpreis_chf && (
                        <span className="text-xs text-gray-500">
                          (Contrel VK CHF {currentVkChf.toFixed(2)} · Markt CHF {ergebnis.marktpreis_chf.toFixed(2)})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Anbieter-Tabelle (ausklappbar) */}
              {ergebnis.anbieter.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAnbieter(v => !v)}
                    className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 py-1 group"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="text-gray-400 group-hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
                        </svg>
                      </span>
                      {ergebnis.anbieter.length} Anbieter gefunden
                    </span>
                    <svg className={`w-4 h-4 transition-transform ${showAnbieter ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showAnbieter && (
                    <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-left">
                            <th className="px-3 py-2 font-semibold text-gray-600">Händler</th>
                            <th className="px-3 py-2 font-semibold text-gray-600 text-right">Preis CHF (netto)</th>
                            <th className="px-3 py-2 font-semibold text-gray-600 text-center">Verfügbar</th>
                            <th className="px-3 py-2 font-semibold text-gray-600">Hinweis</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ergebnis.anbieter.map((a, i) => (
                            <tr
                              key={i}
                              className={`border-b border-gray-100 last:border-0 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                            >
                              <td className="px-3 py-2">
                                <span className={a.prioritaet === 'A' ? 'font-semibold text-blue-800' : 'text-gray-700'}>
                                  {a.name}
                                </span>
                                {a.prioritaet === 'A' && (
                                  <span className="ml-1.5 text-[10px] font-medium text-blue-500 bg-blue-50 rounded px-1">CH</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-mono">
                                {a.preis_netto_chf !== null && a.preis_netto_chf !== undefined ? (
                                  <>
                                    <span className="font-semibold">{a.preis_netto_chf.toFixed(2)}</span>
                                    {a.ursprung === 'EUR' && a.preis_original !== null && a.preis_original !== undefined && (
                                      <span className="text-gray-400 ml-1">← EUR {a.preis_original.toFixed(2)}</span>
                                    )}
                                  </>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {a.verfuegbar
                                  ? <span className="text-green-600 font-bold">✓</span>
                                  : <span className="text-gray-300">✗</span>}
                              </td>
                              <td className="px-3 py-2 text-gray-500 italic">{a.hinweis ?? ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Gesamthinweis */}
              {ergebnis.hinweis && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <strong>Hinweis:</strong> {ergebnis.hinweis}
                </div>
              )}

              {/* Meta */}
              <div className="text-xs text-gray-400 flex flex-wrap items-center gap-2">
                <span>Recherche: {ergebnis.recherche_datum}</span>
                <span>·</span>
                <span>"{ergebnis.suchbegriff}"</span>
                <span>·</span>
                <span>EUR/CHF: {ergebnis.eur_chf_kurs}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">

          {(state === 'eingabe') && (
            <>
              <button type="button" onClick={onClose} className="btn-secondary text-sm py-2">
                Abbrechen
              </button>
              <button
                type="button"
                onClick={recherchieren}
                disabled={!suchbegriff.trim()}
                className="btn-primary text-sm py-2 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Recherche starten
              </button>
            </>
          )}

          {state === 'fehler' && (
            <>
              <button type="button" onClick={onClose} className="btn-secondary text-sm py-2">
                Abbrechen
              </button>
              <button type="button" onClick={recherchieren} className="btn-primary text-sm py-2">
                Erneut versuchen
              </button>
            </>
          )}

          {state === 'laden' && (
            <div className="flex-1 text-center text-sm text-gray-400 italic">
              Bitte warten – Recherche läuft…
            </div>
          )}

          {state === 'ergebnis' && ergebnis && (
            <>
              <button
                type="button"
                onClick={() => setState('eingabe')}
                className="btn-secondary text-sm py-2 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Neu recherchieren
              </button>
              <div className="flex items-center gap-3">
                <button type="button" onClick={onClose} className="btn-ghost text-sm py-2">
                  Schliessen
                </button>
                <button
                  type="button"
                  onClick={() => { onSave(ergebnis); onClose(); }}
                  className="btn-primary text-sm py-2 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Übernehmen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
