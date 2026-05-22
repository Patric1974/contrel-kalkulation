import React, { useState, useRef } from 'react';
import type { MarketPrice } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface SearchResult {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  prices: { raw: string; value: number }[];
}

interface SearchResponse {
  results: SearchResult[];
  summary: { min: number; max: number; avg: number; count: number } | null;
  query: string;
}

interface MarketPriceSearchProps {
  articleName: string;
  articleNumber: string;
  onAddPrice: (price: MarketPrice) => void;
  onClose: () => void;
}

export function MarketPriceSearch({ articleName, articleNumber, onAddPrice, onClose }: MarketPriceSearchProps) {
  const [query, setQuery] = useState(articleName || articleNumber || '');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState('');
  const [added, setAdded] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const search = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await fetch(`/api/market-search?q=${encodeURIComponent(q.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Fehler');
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Suche fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (price: number, domain: string, key: string) => {
    onAddPrice({ id: uuidv4(), source: domain, price });
    setAdded(prev => new Set(prev).add(key));
  };

  const resultsWithPrices = data?.results.filter(r => r.prices.length > 0) ?? [];
  const resultsWithoutPrices = data?.results.filter(r => r.prices.length === 0) ?? [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Marktpreise suchen</h2>
            <p className="text-sm text-gray-500">Schweizer Markt · Öffentliche Preise</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="z.B. Panasonic CR2, Samsung INR21700..."
              className="input-field flex-1"
              autoFocus
            />
            <button
              onClick={() => search()}
              disabled={loading || !query.trim()}
              className="btn-primary flex items-center gap-2 px-5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              Suchen
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Sucht öffentlich verfügbare Preise auf dem Schweizer Markt via DuckDuckGo.
            Preise können inkl. MwSt. und/oder VEG sein.
          </p>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {!data && !loading && !error && (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm">Suchbegriff eingeben und auf Suchen klicken</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-blue-900/20 border-t-blue-900 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-500">Suche auf dem Schweizer Markt...</p>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Summary */}
              {data.summary && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-2">
                    Gefundene Preise ({data.summary.count} Treffer)
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: 'Minimum', value: data.summary.min, color: 'text-green-700' },
                      { label: 'Durchschnitt', value: data.summary.avg, color: 'text-blue-700' },
                      { label: 'Maximum', value: data.summary.max, color: 'text-red-700' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-white rounded-lg p-2 shadow-sm">
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className={`text-base font-bold font-mono ${color}`}>
                          {value.toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleAdd(
                            parseFloat(value.toFixed(2)),
                            label,
                            `summary-${label}`
                          )}
                          disabled={added.has(`summary-${label}`)}
                          className={`mt-1 text-xs px-2 py-0.5 rounded transition-colors ${
                            added.has(`summary-${label}`)
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {added.has(`summary-${label}`) ? '✓ Hinzugefügt' : '+ Übernehmen'}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 italic">
                    ⚠ Preise können inkl. MwSt. (8.1%) und/oder VEG sein — bitte beim Übernehmen berücksichtigen.
                  </p>
                </div>
              )}

              {/* Results with prices */}
              {resultsWithPrices.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Treffer mit Preisangaben ({resultsWithPrices.length})
                  </h3>
                  <div className="space-y-2">
                    {resultsWithPrices.map((result, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-700 hover:underline line-clamp-1"
                              title={result.title}
                            >
                              {result.title}
                            </a>
                            <p className="text-xs text-green-600 font-medium mt-0.5">{result.domain}</p>
                            {result.snippet && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{result.snippet}</p>
                            )}
                          </div>
                          {/* Price buttons */}
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            {result.prices.map((p, pi) => {
                              const key = `${i}-${pi}`;
                              return (
                                <button
                                  key={pi}
                                  onClick={() => handleAdd(p.value, result.domain, key)}
                                  disabled={added.has(key)}
                                  className={`text-xs px-3 py-1.5 rounded-lg font-mono font-semibold transition-colors whitespace-nowrap ${
                                    added.has(key)
                                      ? 'bg-green-100 text-green-700 cursor-default'
                                      : 'bg-orange-100 text-orange-800 hover:bg-orange-200 cursor-pointer'
                                  }`}
                                >
                                  {added.has(key) ? '✓' : '+'} CHF {p.value.toFixed(2)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Results without prices */}
              {resultsWithoutPrices.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Weitere Treffer (kein Preis erkannt)
                  </h3>
                  <div className="space-y-1.5">
                    {resultsWithoutPrices.map((result, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-gray-50">
                        <span className="text-gray-400 text-xs w-20 flex-shrink-0 truncate">{result.domain}</span>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate flex-1 text-xs"
                          title={result.title}
                        >
                          {result.title}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.results.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Keine Treffer gefunden.</p>
                  <p className="text-xs mt-1">Versuche einen anderen Suchbegriff (z.B. EAN-Nummer oder Kurzbezeichnung).</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {added.size > 0 ? `${added.size} Preis${added.size > 1 ? 'e' : ''} übernommen` : 'Preise mit + übernehmen'}
          </p>
          <button onClick={onClose} className="btn-primary text-sm">
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
}
