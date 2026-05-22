import React, { useState } from 'react';
import type { Article, PriceTier } from '../types';
import { calculatePrice, calculateMargin, getMarketStats, getPriceSignal } from '../utils/pricing';

interface PriceTableProps {
  article: Article;
  onUpdateWindowTier: (idx: number, updates: Partial<PriceTier>) => void;
  onUpdateBusinessTier: (idx: number, updates: Partial<PriceTier>) => void;
  readOnly?: boolean;
}

type EditingCell = { category: 'window' | 'business'; tierIdx: number; field: 'markup' | 'minQty' | 'maxQty' } | null;

const SIGNAL_COLORS = {
  green: 'text-green-500',
  yellow: 'text-yellow-500',
  red: 'text-red-500',
};

function EditableNumber({
  value,
  onSave,
  readOnly,
  className = '',
  step = 1,
  suffix = '',
}: {
  value: number | null;
  onSave: (v: number) => void;
  readOnly: boolean;
  className?: string;
  step?: number;
  suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (readOnly || !editing) {
    return (
      <span
        className={`cursor-pointer hover:bg-blue-50 px-1 rounded transition-colors ${readOnly ? '' : 'hover:underline'} ${className}`}
        onClick={() => {
          if (!readOnly) {
            setDraft(String(value ?? ''));
            setEditing(true);
          }
        }}
        title={readOnly ? undefined : 'Klicken zum Bearbeiten'}
      >
        {value !== null ? `${value}${suffix}` : '—'}
      </span>
    );
  }

  return (
    <input
      autoFocus
      type="number"
      value={draft}
      step={step}
      onChange={e => {
        setDraft(e.target.value);
        const parsed = parseFloat(e.target.value);
        if (!isNaN(parsed)) onSave(parsed);
      }}
      onBlur={() => {
        const parsed = parseFloat(draft);
        if (!isNaN(parsed)) onSave(parsed);
        setEditing(false);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          const parsed = parseFloat(draft);
          if (!isNaN(parsed)) onSave(parsed);
          setEditing(false);
        } else if (e.key === 'Escape') {
          setEditing(false);
        }
      }}
      className="w-16 border border-blue-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  );
}

interface TierRowProps {
  label: string;
  tier: PriceTier;
  tierIdx: number;
  purchasePrice: number;
  veg: number | null;
  marketAvg: number | null;
  onUpdate: (updates: Partial<PriceTier>) => void;
  readOnly: boolean;
  isLast: boolean;
  categoryColor: string;
  showCategoryLabel: boolean;
  categoryLabel: string;
  categoryRowSpan: number;
}

function TierRow({
  label,
  tier,
  tierIdx,
  purchasePrice,
  veg,
  marketAvg,
  onUpdate,
  readOnly,
  isLast,
  categoryColor,
  showCategoryLabel,
  categoryLabel,
  categoryRowSpan,
}: TierRowProps) {
  const priceExcl = calculatePrice(purchasePrice, tier.markup, veg, false);
  const priceIncl = calculatePrice(purchasePrice, tier.markup, veg, true);
  const margin = calculateMargin(purchasePrice, priceExcl);
  const signal = marketAvg ? getPriceSignal(priceIncl, marketAvg) : null;

  const qtyLabel = tier.maxQty === null
    ? `ab ${tier.minQty}`
    : tier.minQty === tier.maxQty
      ? `${tier.minQty}`
      : `${tier.minQty}–${tier.maxQty}`;

  return (
    <tr className={`${isLast ? '' : 'border-b border-gray-100'} ${tierIdx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
      {showCategoryLabel && (
        <td
          className={`table-cell font-semibold text-xs uppercase tracking-wide ${categoryColor} align-middle`}
          rowSpan={categoryRowSpan}
        >
          {categoryLabel}
        </td>
      )}
      <td className="table-cell text-center text-base font-mono text-gray-600">{qtyLabel}</td>
      <td className="table-cell text-center">
        <EditableNumber
          value={tier.markup}
          onSave={v => onUpdate({ markup: v })}
          readOnly={readOnly}
          suffix="%"
          step={0.5}
          className="text-base"
        />
      </td>
      <td className="table-cell text-right font-mono text-base">
        {priceExcl.toFixed(2)}
      </td>
      <td className="table-cell text-right font-mono text-base">
        {priceIncl.toFixed(2)}
      </td>
      <td className="table-cell text-right text-base text-gray-600">
        {margin.toFixed(1)}%
      </td>
      <td className="table-cell text-center">
        {signal ? (
          <span className={`text-lg leading-none ${SIGNAL_COLORS[signal]}`} title={
            signal === 'green' ? 'Unter Marktpreis' :
            signal === 'yellow' ? 'Leicht über Marktpreis' :
            'Über Marktpreis'
          }>●</span>
        ) : (
          <span className="text-gray-300">●</span>
        )}
      </td>
    </tr>
  );
}

export function PriceTable({ article, onUpdateWindowTier, onUpdateBusinessTier, readOnly = false }: PriceTableProps) {
  const marketStats = getMarketStats(article.marketPrices);
  const marketAvg = marketStats?.avg ?? null;
  const veg = article.vegAmount;

  const wTiers = article.windowPriceCategory.tiers;
  const bTiers = article.businessPriceCategory.tiers;
  const dealerTier = bTiers[2]; // Händler = Firmenkunde T3

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="table-header text-left rounded-tl-lg w-32">Kategorie</th>
            <th className="table-header text-center w-20">Menge</th>
            <th className="table-header text-center w-24">Aufschlag</th>
            <th className="table-header text-right w-28">Exkl. VEG</th>
            <th className="table-header text-right w-28">Inkl. VEG</th>
            <th className="table-header text-right w-20">Marge</th>
            <th className="table-header text-center rounded-tr-lg w-16">Markt</th>
          </tr>
        </thead>
        <tbody>
          {/* Shopkundenpreis */}
          {wTiers.map((tier, idx) => (
            <TierRow
              key={`w-${idx}`}
              label={`T${idx + 1}`}
              tier={tier}
              tierIdx={idx}
              purchasePrice={article.purchasePrice}
              veg={veg}
              marketAvg={marketAvg}
              onUpdate={updates => onUpdateWindowTier(idx, updates)}
              readOnly={readOnly}
              isLast={idx === wTiers.length - 1}
              categoryColor="text-blue-800"
              showCategoryLabel={idx === 0}
              categoryLabel="Shopkunden"
              categoryRowSpan={wTiers.length}
            />
          ))}

          {/* Separator */}
          <tr><td colSpan={8} className="h-px bg-gray-200"></td></tr>

          {/* Firmenkundenpreis */}
          {bTiers.map((tier, idx) => (
            <TierRow
              key={`b-${idx}`}
              label={`T${idx + 1}`}
              tier={tier}
              tierIdx={idx}
              purchasePrice={article.purchasePrice}
              veg={veg}
              marketAvg={marketAvg}
              onUpdate={updates => onUpdateBusinessTier(idx, updates)}
              readOnly={readOnly}
              isLast={idx === bTiers.length - 1}
              categoryColor="text-orange-700"
              showCategoryLabel={idx === 0}
              categoryLabel="Firmenkunde"
              categoryRowSpan={bTiers.length}
            />
          ))}

          {/* Separator */}
          <tr><td colSpan={8} className="h-px bg-gray-200"></td></tr>

          {/* Händlerpreis (auto = Firmenkunde T3) */}
          {dealerTier && (
            <TierRow
              key="dealer"
              label="(= FK T3)"
              tier={dealerTier}
              tierIdx={2}
              purchasePrice={article.purchasePrice}
              veg={veg}
              marketAvg={marketAvg}
              onUpdate={() => {}}
              readOnly={true}
              isLast={true}
              categoryColor="text-purple-700"
              showCategoryLabel={true}
              categoryLabel="Händler"
              categoryRowSpan={1}
            />
          )}
        </tbody>
      </table>

      {article.purchasePrice > 0 && (
        <div className="mt-1 px-2 text-xs text-gray-400">
          EK: CHF {article.purchasePrice.toFixed(2)}
          {veg !== null && ` | VEG: CHF ${veg.toFixed(2)}`}
          {marketAvg !== null && ` | Markt Ø: CHF ${marketAvg.toFixed(2)}`}
        </div>
      )}
    </div>
  );
}
