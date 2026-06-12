import React, { useState } from 'react';
import type { Article, PriceTier } from '../types';
import { VegAssistant } from './VegAssistant';
import { PriceTable } from './PriceTable';
import { MarketPrices } from './MarketPrices';
import { calculatePrice } from '../utils/pricing';

interface ArticleFormProps {
  article: Article;
  index: number;
  onChange: (updated: Article) => void;
  onRemove: () => void;
  readOnly?: boolean;
}

export function ArticleForm({ article, index, onChange, onRemove, readOnly = false }: ArticleFormProps) {
  const [expanded, setExpanded] = useState(true);

  const update = (updates: Partial<Article>) => {
    onChange({ ...article, ...updates });
  };

  const updateWindowTier = (idx: number, updates: Partial<PriceTier>) => {
    const tiers = [...article.windowPriceCategory.tiers];
    tiers[idx] = { ...tiers[idx], ...updates };
    update({ windowPriceCategory: { tiers } });
  };

  const updateBusinessTier = (idx: number, updates: Partial<PriceTier>) => {
    const tiers = [...article.businessPriceCategory.tiers];
    tiers[idx] = { ...tiers[idx], ...updates };
    update({ businessPriceCategory: { tiers } });
  };

  const displayName = article.name || `Artikel ${index + 1}`;

  return (
    <div className="card overflow-hidden">
      {/* Card Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{displayName}</h3>
            {article.articleNumber && (
              <p className="text-xs text-gray-500">Art.-Nr.: {article.articleNumber}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {article.purchasePrice > 0 && (
            <span className="text-xs text-gray-500 hidden sm:block">
              EK: CHF {article.purchasePrice.toFixed(2)}
            </span>
          )}

          {/* Status-Badges im Header */}
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => !readOnly && update({ shopPflege: !article.shopPflege })}
              title={article.shopPflege ? 'Im Shop eingepflegt' : 'Noch nicht im Shop eingepflegt'}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-semibold border-2 transition-all ${
                article.shopPflege
                  ? 'bg-green-100 text-green-700 border-green-400 shadow-sm'
                  : 'bg-gray-50 text-gray-400 border-gray-300'
              } ${!readOnly ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Shop
              {article.shopPflege && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
            </button>
            <button
              type="button"
              onClick={() => !readOnly && update({ erpPflege: !article.erpPflege })}
              title={article.erpPflege ? 'Im ERP eingepflegt' : 'Noch nicht im ERP eingepflegt'}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-semibold border-2 transition-all ${
                article.erpPflege
                  ? 'bg-blue-100 text-blue-700 border-blue-400 shadow-sm'
                  : 'bg-gray-50 text-gray-400 border-gray-300'
              } ${!readOnly ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
              ERP
              {article.erpPflege && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
            </button>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onRemove(); }}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
              title="Artikel entfernen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="p-4">
          <div className="flex flex-col xl:flex-row gap-5">

            {/* LEFT COLUMN — Inputs */}
            <div className="xl:w-[420px] flex-shrink-0 space-y-4">

              {/* Grunddaten */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Grunddaten
                </h4>
                <div className="space-y-2">

                  {/* Artikelnummer + Einkaufspreis — hervorgehoben */}
                  <div className="grid grid-cols-2 gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-blue-800 mb-1">Artikelnummer</label>
                      {readOnly ? (
                        <p className="text-sm font-bold text-blue-900">{article.articleNumber || '—'}</p>
                      ) : (
                        <input
                          type="text"
                          value={article.articleNumber}
                          onChange={e => update({ articleNumber: e.target.value })}
                          placeholder="z.B. BAT-001"
                          className="input-field font-semibold text-blue-900 bg-white border-blue-300 focus:border-blue-500"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-blue-800 mb-1">Einkaufspreis (CHF)</label>
                      {readOnly ? (
                        <p className="text-sm font-bold text-blue-900">CHF {article.purchasePrice.toFixed(2)}</p>
                      ) : (
                        <input
                          type="number"
                          value={article.purchasePrice || ''}
                          onChange={e => update({ purchasePrice: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="input-field font-semibold text-blue-900 bg-white border-blue-300 focus:border-blue-500"
                        />
                      )}
                    </div>
                  </div>

                  {/* Bezeichnung */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bezeichnung</label>
                    {readOnly ? (
                      <p className="text-sm text-gray-900">{article.name || '—'}</p>
                    ) : (
                      <input
                        type="text"
                        value={article.name}
                        onChange={e => update({ name: e.target.value })}
                        placeholder="Produktbezeichnung"
                        className="input-field"
                      />
                    )}
                  </div>

                </div>
              </div>

              {/* VEG Section */}
              <div className="border-t border-gray-100 pt-3">
                <VegAssistant
                  batteryType={article.batteryType}
                  batterySize={article.batterySize}
                  weightGrams={article.weightGrams}
                  vegAmount={article.vegAmount}
                  vegManualOverride={article.vegManualOverride}
                  inobatArticleNumber={article.inobatArticleNumber}
                  onChange={updates => update(updates)}
                  readOnly={readOnly}
                />
              </div>

              {/* Market Prices */}
              <div className="border-t border-gray-100 pt-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                  Marktpreise
                </h4>
                <MarketPrices
                  prices={article.marketPrices}
                  onChange={prices => update({ marketPrices: prices })}
                  readOnly={readOnly}
                  articleName={article.name}
                  articleNumber={article.articleNumber}
                  marktpreis={article.marktpreis}
                  onMarktpreisChange={m => update({ marktpreis: m })}
                  currentVkChf={
                    article.purchasePrice > 0
                      ? calculatePrice(
                          article.purchasePrice,
                          article.windowPriceCategory.tiers[0]?.markup ?? 80,
                          article.vegAmount ?? 0,
                          true,
                        )
                      : undefined
                  }
                />
              </div>
            </div>

            {/* RIGHT COLUMN — Price Table */}
            <div className="flex-1 min-w-0">
              {article.purchasePrice > 0 ? (
                <>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    Preiskalkulation
                    {!readOnly && (
                      <span className="text-xs text-gray-400 font-normal normal-case ml-1">(Aufschlag % klicken zum Bearbeiten)</span>
                    )}
                  </h4>
                  <PriceTable
                    article={article}
                    onUpdateWindowTier={updateWindowTier}
                    onUpdateBusinessTier={updateBusinessTier}
                    readOnly={readOnly}
                  />
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-300 text-sm border border-dashed border-gray-200 rounded-lg py-12">
                  Einkaufspreis eingeben um die Kalkulation zu sehen
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
