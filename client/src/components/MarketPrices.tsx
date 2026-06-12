import React, { useState } from 'react';
import type { AmpelStatus, MarketPrice, MarktpreisErgebnis } from '../types';
import { getMarketStats } from '../utils/pricing';
import { MarketPriceSearch } from './MarketPriceSearch';
import { MarktpreisModal } from './MarktpreisModal';

interface MarketPricesProps {
  prices: MarketPrice[];
  onChange: (prices: MarketPrice[]) => void;
  readOnly?: boolean;
  articleName?: string;
  articleNumber?: string;
  marktpreis?: MarktpreisErgebnis;
  onMarktpreisChange?: (m: MarktpreisErgebnis) => void;
  currentVkChf?: number;
}

const AMPEL_DOT: Record<AmpelStatus, string> = {
  gruen: 'bg-green-500',
  gelb: 'bg-yellow-500',
  rot: 'bg-red-500',
  unbekannt: 'bg-gray-400',
};
const AMPEL_LABEL: Record<AmpelStatus, string> = {
  gruen: 'Günstig',
  gelb: 'Leicht teuer',
  rot: 'Zu teuer',
  unbekannt: 'Unbekannt',
};

export function MarketPrices({
  prices,
  onChange,
  readOnly = false,
  articleName = '',
  articleNumber = '',
  marktpreis,
  onMarktpreisChange,
  currentVkChf,
}: MarketPricesProps) {
  const [open, setOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const stats = getMarketStats(prices);

  const addPrice = () => {
    onChange([...prices, { id: crypto.randomUUID(), source: '', price: 0 }]);
    setOpen(true);
  };

  const updatePrice = (id: string, field: 'source' | 'price', value: string | number) => {
    onChange(prices.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePrice = (id: string) => {
    onChange(prices.filter(p => p.id !== id));
  };

  const handleAddFromSearch = (price: MarketPrice) => {
    onChange([...prices, price]);
    setOpen(true);
  };

  return (
    <>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Accordion-Header */}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Marktpreise
            {prices.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                {prices.length}
              </span>
            )}
            {stats && (
              <span className="text-gray-500 font-normal">Ø CHF {stats.avg.toFixed(2)}</span>
            )}
          </span>

          <span className="flex items-center gap-2">
            {/* KI-Ampel-Badge wenn vorhanden */}
            {marktpreis && (
              <span
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  marktpreis.ampel === 'gruen' ? 'bg-green-100 text-green-700' :
                  marktpreis.ampel === 'gelb' ? 'bg-yellow-100 text-yellow-700' :
                  marktpreis.ampel === 'rot' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-500'
                }`}
                title={`KI-Recherche: ${marktpreis.recherche_datum}`}
                onClick={e => { e.stopPropagation(); setShowModal(true); }}
              >
                <span className={`w-2 h-2 rounded-full ${AMPEL_DOT[marktpreis.ampel]}`} />
                {AMPEL_LABEL[marktpreis.ampel]}
                {marktpreis.marktpreis_chf !== null && (
                  <span className="ml-1 opacity-70">CHF {marktpreis.marktpreis_chf.toFixed(2)}</span>
                )}
              </span>
            )}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {open && (
          <div className="px-4 py-3 space-y-2">
            {prices.length === 0 && !marktpreis && (
              <p className="text-sm text-gray-400 italic">Keine Marktpreise erfasst</p>
            )}

            {/* KI-Recherche Kompakt-Summary */}
            {marktpreis && (
              <div className={`rounded-lg p-3 border text-xs ${
                marktpreis.ampel === 'gruen' ? 'bg-green-50 border-green-200' :
                marktpreis.ampel === 'gelb' ? 'bg-yellow-50 border-yellow-200' :
                marktpreis.ampel === 'rot' ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${AMPEL_DOT[marktpreis.ampel]}`} />
                    KI-Marktanalyse
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setShowModal(true)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Aktualisieren
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600">
                  <span>Tiefstpreis: <strong className="text-gray-800">{marktpreis.tiefstpreis_chf !== null ? `CHF ${marktpreis.tiefstpreis_chf.toFixed(2)}` : '—'}</strong></span>
                  <span>Marktpreis: <strong className="text-gray-800">{marktpreis.marktpreis_chf !== null ? `CHF ${marktpreis.marktpreis_chf.toFixed(2)}` : '—'}</strong></span>
                  <span>Empfehlung: <strong className="text-gray-800">{marktpreis.empfehlung_vk_chf !== null ? `CHF ${marktpreis.empfehlung_vk_chf.toFixed(2)}` : '—'}</strong></span>
                  <span>Stand: <strong className="text-gray-800">{marktpreis.recherche_datum}</strong></span>
                </div>
              </div>
            )}

            {/* Manuelle Preisliste */}
            {prices.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{idx + 1}.</span>
                {readOnly ? (
                  <>
                    <span className="flex-1 text-sm text-gray-700">{p.source || '—'}</span>
                    <span className="text-sm font-medium text-gray-900 w-24 text-right">
                      CHF {p.price.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={p.source}
                      onChange={e => updatePrice(p.id, 'source', e.target.value)}
                      placeholder="Quelle (z.B. Galaxus)"
                      className="input-field flex-1 text-sm py-1.5"
                    />
                    <input
                      type="number"
                      value={p.price || ''}
                      onChange={e => updatePrice(p.id, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      step="0.05"
                      min="0"
                      className="input-field w-24 text-sm py-1.5 text-right"
                    />
                    <button
                      type="button"
                      onClick={() => removePrice(p.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      title="Entfernen"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}

            {!readOnly && (
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100 flex-wrap">
                {prices.length < 5 && (
                  <button
                    type="button"
                    onClick={addPrice}
                    className="text-sm text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Manuell hinzufügen
                  </button>
                )}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setShowSearch(true); }}
                  className="text-sm text-orange-600 hover:text-orange-800 font-medium flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Websuche
                </button>
                {onMarktpreisChange && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setShowModal(true); }}
                    className="text-sm text-purple-700 hover:text-purple-900 font-medium flex items-center gap-1.5 ml-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347A3.001 3.001 0 0112 15a3 3 0 01-2.12-5.12l.243-.243" />
                    </svg>
                    KI-Marktanalyse
                  </button>
                )}
              </div>
            )}

            {stats && (
              <div className="pt-2 border-t border-gray-100 flex gap-4 text-xs text-gray-600">
                <span>Ø <strong className="text-gray-800">CHF {stats.avg.toFixed(2)}</strong></span>
                <span>Min <strong className="text-gray-800">CHF {stats.min.toFixed(2)}</strong></span>
                <span>Max <strong className="text-gray-800">CHF {stats.max.toFixed(2)}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {showSearch && (
        <MarketPriceSearch
          articleName={articleName}
          articleNumber={articleNumber}
          onAddPrice={handleAddFromSearch}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showModal && (
        <MarktpreisModal
          articleName={articleName}
          articleNumber={articleNumber}
          currentVkChf={currentVkChf}
          marktpreis={marktpreis}
          onSave={m => { onMarktpreisChange?.(m); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
