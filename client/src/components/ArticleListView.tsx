import React, { useState } from 'react';
import type { Article } from '../types';
import { BATTERY_TYPE_LABELS } from '../types';
import { calculatePrice, getMarketStats, getPriceSignal } from '../utils/pricing';

interface ArticleListViewProps {
  articles: Article[];
  onEditArticle: (idx: number) => void;
  onUpdateArticle?: (idx: number, updates: Partial<Article>) => void;
  readOnly?: boolean;
}

type PriceMode = 'inkl' | 'exkl' | 'beide';

function chf(val: number) {
  return val.toFixed(2);
}

export function ArticleListView({ articles, onEditArticle, onUpdateArticle, readOnly = false }: ArticleListViewProps) {
  const [priceMode, setPriceMode] = useState<PriceMode>('inkl');
  const [highlight, setHighlight] = useState<number | null>(null);

  if (articles.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
        </svg>
        Noch keine Artikel vorhanden.
      </div>
    );
  }

  const showInkl = priceMode === 'inkl' || priceMode === 'beide';
  const showExkl = priceMode === 'exkl' || priceMode === 'beide';

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
        <span className="text-sm text-gray-500 font-medium">{articles.length} Artikel</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Preisansicht:</span>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
            {(['inkl', 'exkl', 'beide'] as PriceMode[]).map(m => (
              <button
                key={m}
                onClick={() => setPriceMode(m)}
                className={`px-3 py-1.5 transition-colors ${priceMode === m ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {m === 'inkl' ? 'Inkl. VEG' : m === 'exkl' ? 'Exkl. VEG' : 'Beide'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="text-xs border-collapse" style={{ minWidth: priceMode === 'beide' ? '1400px' : '900px' }}>
          <thead>
            {/* Row 1: Group headers */}
            <tr>
              <th rowSpan={3} className="table-header text-left rounded-tl-xl w-8 px-2">#</th>
              <th rowSpan={3} className="table-header text-left w-20">Art.-Nr.</th>
              <th rowSpan={3} className="table-header text-left min-w-[180px]">Bezeichnung</th>
              <th rowSpan={3} className="table-header text-right w-16">EK CHF</th>
              <th rowSpan={3} className="table-header text-right w-14">VEG</th>
              <th rowSpan={3} className="table-header text-center w-14">Shop</th>
              <th rowSpan={3} className="table-header text-center w-14">ERP</th>

              {showInkl && (
                <th colSpan={7} className="px-3 py-1.5 text-center text-white text-xs font-bold uppercase tracking-wide bg-yellow-600 border-b border-yellow-500">
                  Preise inkl. VEG — für Webshop / Preispflege
                </th>
              )}
              {showExkl && (
                <th colSpan={7} className="px-3 py-1.5 text-center text-white text-xs font-bold uppercase tracking-wide bg-gray-600 border-b border-gray-500">
                  Preise exkl. VEG — für ERP Preispflege
                </th>
              )}
            </tr>

            {/* Row 2: Category headers */}
            <tr>
              {showInkl && (
                <>
                  <th colSpan={3} className="px-3 py-1.5 text-center text-white text-xs font-semibold bg-blue-800 border-r border-blue-600">Shopkunden</th>
                  <th colSpan={3} className="px-3 py-1.5 text-center text-white text-xs font-semibold bg-orange-700 border-r border-orange-600">Firmenkunden</th>
                  <th rowSpan={2} className="px-3 py-1.5 text-center text-white text-xs font-semibold bg-purple-700 border-r border-purple-600">Händler</th>
                </>
              )}
              {showExkl && (
                <>
                  <th colSpan={3} className="px-3 py-1.5 text-center text-white text-xs font-semibold bg-blue-700 border-r border-blue-500">Shopkunden</th>
                  <th colSpan={3} className="px-3 py-1.5 text-center text-white text-xs font-semibold bg-orange-600 border-r border-orange-500">Firmenkunden</th>
                  <th rowSpan={2} className={`px-3 py-1.5 text-center text-white text-xs font-semibold bg-purple-600 ${!showInkl ? 'rounded-tr-xl' : ''}`}>Händler</th>
                </>
              )}
            </tr>

            {/* Row 3: Staffel sub-headers */}
            <tr>
              {showInkl && (
                <>
                  <th className="px-2 py-1.5 text-center text-blue-200 bg-blue-800 font-medium w-20">1–9 Stk</th>
                  <th className="px-2 py-1.5 text-center text-blue-200 bg-blue-800 font-medium w-20">ab 10</th>
                  <th className="px-2 py-1.5 text-center text-blue-200 bg-blue-800 font-medium w-20 border-r border-blue-600">ab 50</th>
                  <th className="px-2 py-1.5 text-center text-orange-200 bg-orange-700 font-medium w-20">1–9 Stk</th>
                  <th className="px-2 py-1.5 text-center text-orange-200 bg-orange-700 font-medium w-20">ab 10</th>
                  <th className="px-2 py-1.5 text-center text-orange-200 bg-orange-700 font-medium w-20 border-r border-orange-600">ab 50</th>
                </>
              )}
              {showExkl && (
                <>
                  <th className="px-2 py-1.5 text-center text-blue-200 bg-blue-700 font-medium w-20">1–9 Stk</th>
                  <th className="px-2 py-1.5 text-center text-blue-200 bg-blue-700 font-medium w-20">ab 10</th>
                  <th className="px-2 py-1.5 text-center text-blue-200 bg-blue-700 font-medium w-20 border-r border-blue-500">ab 50</th>
                  <th className="px-2 py-1.5 text-center text-orange-200 bg-orange-600 font-medium w-20">1–9 Stk</th>
                  <th className="px-2 py-1.5 text-center text-orange-200 bg-orange-600 font-medium w-20">ab 10</th>
                  <th className="px-2 py-1.5 text-center text-orange-200 bg-orange-600 font-medium w-20 border-r border-orange-500">ab 50</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {articles.map((article, idx) => {
              const veg = article.vegAmount ?? 0;
              const wt = article.windowPriceCategory.tiers;
              const bt = article.businessPriceCategory.tiers;
              const marketStats = getMarketStats(article.marketPrices);
              const marketAvg = marketStats?.avg ?? null;
              const hasPrice = article.purchasePrice > 0;

              // Inkl. VEG
              const sw1i = calculatePrice(article.purchasePrice, wt[0]?.markup ?? 80, veg, true);
              const sw2i = calculatePrice(article.purchasePrice, wt[1]?.markup ?? 65, veg, true);
              const sw3i = calculatePrice(article.purchasePrice, wt[2]?.markup ?? 50, veg, true);
              const fk1i = calculatePrice(article.purchasePrice, bt[0]?.markup ?? 55, veg, true);
              const fk2i = calculatePrice(article.purchasePrice, bt[1]?.markup ?? 40, veg, true);
              const fk3i = calculatePrice(article.purchasePrice, bt[2]?.markup ?? 25, veg, true);

              // Exkl. VEG
              const sw1e = calculatePrice(article.purchasePrice, wt[0]?.markup ?? 80, veg, false);
              const sw2e = calculatePrice(article.purchasePrice, wt[1]?.markup ?? 65, veg, false);
              const sw3e = calculatePrice(article.purchasePrice, wt[2]?.markup ?? 50, veg, false);
              const fk1e = calculatePrice(article.purchasePrice, bt[0]?.markup ?? 55, veg, false);
              const fk2e = calculatePrice(article.purchasePrice, bt[1]?.markup ?? 40, veg, false);
              const fk3e = calculatePrice(article.purchasePrice, bt[2]?.markup ?? 25, veg, false);

              const aiAmpel = article.marktpreis?.ampel ?? null;
              const signal = !aiAmpel && marketAvg ? getPriceSignal(sw1i, marketAvg) : null;
              const isHighlighted = highlight === idx;
              const na = <span className="text-gray-300">0,00</span>;

              return (
                <tr
                  key={article.id}
                  className={`border-b border-gray-100 cursor-pointer transition-colors ${isHighlighted ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50`}
                  onClick={() => onEditArticle(idx)}
                  onMouseEnter={() => setHighlight(idx)}
                  onMouseLeave={() => setHighlight(null)}
                  title="Klicken zum Bearbeiten"
                >
                  <td className="px-2 py-2 text-gray-400 text-center">{idx + 1}</td>
                  <td className="px-2 py-2 font-mono text-gray-700 font-medium">{article.articleNumber || '—'}</td>
                  <td className="px-2 py-2">
                    <div className="font-medium text-gray-900 truncate max-w-[220px]" title={article.name}>
                      {article.name || <span className="text-gray-400 italic">Ohne Bezeichnung</span>}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right font-mono font-semibold text-gray-800">
                    {hasPrice ? chf(article.purchasePrice) : na}
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-gray-500">
                    {veg > 0 ? chf(veg) : <span className="text-gray-300">—</span>}
                  </td>

                  {/* Shop Status */}
                  <td className="px-2 py-2 text-center" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => onUpdateArticle?.(idx, { shopPflege: !article.shopPflege })}
                      title={article.shopPflege ? 'Im Shop eingepflegt ✓' : 'Noch nicht im Shop eingepflegt'}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center mx-auto transition-colors ${
                        article.shopPflege
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-300 hover:border-green-400'
                      } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {article.shopPflege && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </td>

                  {/* ERP Status */}
                  <td className="px-2 py-2 text-center" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => onUpdateArticle?.(idx, { erpPflege: !article.erpPflege })}
                      title={article.erpPflege ? 'Im ERP eingepflegt ✓' : 'Noch nicht im ERP eingepflegt'}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center mx-auto transition-colors ${
                        article.erpPflege
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white border-gray-300 hover:border-blue-400'
                      } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {article.erpPflege && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </td>

                  {/* Inkl. VEG columns */}
                  {showInkl && (
                    <>
                      <td className="px-2 py-2 text-right font-mono font-bold text-blue-900">
                        {hasPrice ? (
                          <span className="flex items-center justify-end gap-1">
                            {(aiAmpel || signal) && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              aiAmpel === 'gruen' ? 'bg-green-500' :
                              aiAmpel === 'gelb' ? 'bg-yellow-500' :
                              aiAmpel === 'rot' ? 'bg-red-500' :
                              signal === 'green' ? 'bg-green-500' :
                              signal === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            title={aiAmpel ? `KI-Marktanalyse: ${aiAmpel} (Stand ${article.marktpreis?.recherche_datum})` : `Marktvergleich: ${signal}`}
                          />
                        )}
                            {chf(sw1i)}
                          </span>
                        ) : na}
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-blue-800">{hasPrice ? chf(sw2i) : na}</td>
                      <td className="px-2 py-2 text-right font-mono text-blue-700 border-r border-gray-200">{hasPrice ? chf(sw3i) : na}</td>
                      <td className="px-2 py-2 text-right font-mono font-bold text-orange-800">{hasPrice ? chf(fk1i) : na}</td>
                      <td className="px-2 py-2 text-right font-mono text-orange-700">{hasPrice ? chf(fk2i) : na}</td>
                      <td className="px-2 py-2 text-right font-mono text-orange-600 border-r border-gray-200">{hasPrice ? chf(fk3i) : na}</td>
                      <td className="px-2 py-2 text-right font-mono font-bold text-purple-800 border-r border-gray-100">{hasPrice ? chf(fk3i) : na}</td>
                    </>
                  )}

                  {/* Exkl. VEG columns */}
                  {showExkl && (
                    <>
                      <td className="px-2 py-2 text-right font-mono font-bold text-blue-700">{hasPrice ? chf(sw1e) : na}</td>
                      <td className="px-2 py-2 text-right font-mono text-blue-600">{hasPrice ? chf(sw2e) : na}</td>
                      <td className="px-2 py-2 text-right font-mono text-blue-500 border-r border-gray-200">{hasPrice ? chf(sw3e) : na}</td>
                      <td className="px-2 py-2 text-right font-mono font-bold text-orange-600">{hasPrice ? chf(fk1e) : na}</td>
                      <td className="px-2 py-2 text-right font-mono text-orange-500">{hasPrice ? chf(fk2e) : na}</td>
                      <td className="px-2 py-2 text-right font-mono text-orange-400 border-r border-gray-200">{hasPrice ? chf(fk3e) : na}</td>
                      <td className="px-2 py-2 text-right font-mono font-bold text-purple-600">{hasPrice ? chf(fk3e) : na}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>

          {articles.length > 1 && (
            <tfoot>
              <tr className="bg-gray-100 border-t-2 border-gray-300">
                <td colSpan={3} className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {articles.filter(a => a.purchasePrice > 0).length} / {articles.length} Artikel mit EK-Preis
                </td>
                <td className="px-2 py-2 text-right font-mono text-xs font-bold text-gray-700">
                  {articles.filter(a => a.purchasePrice > 0).length > 0
                    ? chf(articles.filter(a => a.purchasePrice > 0).reduce((s, a) => s + a.purchasePrice, 0) / articles.filter(a => a.purchasePrice > 0).length)
                    : '—'}
                </td>
                <td colSpan={showInkl && showExkl ? 15 : 8} className="px-2 py-2 text-xs text-gray-400 italic">
                  Durchschnitt EK · Klick auf Zeile = Artikel bearbeiten
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
