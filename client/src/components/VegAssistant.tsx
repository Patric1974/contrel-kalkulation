import React, { useEffect } from 'react';
import type { BatteryType } from '../types';
import { BATTERY_TYPE_LABELS, STANDARD_SIZE_TYPES, STANDARD_SIZES } from '../types';
import { calculateVeg } from '../utils/veg';

interface VegAssistantProps {
  batteryType: BatteryType | '';
  batterySize: string;
  weightGrams: number | null;
  vegAmount: number | null;
  vegManualOverride: boolean;
  inobatArticleNumber: string;
  onChange: (updates: {
    batteryType?: BatteryType | '';
    batterySize?: string;
    weightGrams?: number | null;
    vegAmount?: number | null;
    vegManualOverride?: boolean;
    inobatArticleNumber?: string;
  }) => void;
  readOnly?: boolean;
}

const GERAET_TYPES: BatteryType[] = ['knopfzelle', 'kohle-zink-standard', 'alkali-standard', 'lithium-primaer', 'nicd-standard', 'nimh-standard', 'liion-geraet'];
const INDUSTRIE_TYPES: BatteryType[] = ['liion-industrie', 'lifepo4-industrie', 'blei-klein', 'blei-gross', 'ebike-liion'];
const FAHRZEUG_TYPES: BatteryType[] = ['blei-fahrzeug', 'lithium-fahrzeug'];

export function VegAssistant({
  batteryType,
  batterySize,
  weightGrams,
  vegAmount,
  vegManualOverride,
  inobatArticleNumber,
  onChange,
  readOnly = false,
}: VegAssistantProps) {
  const needsSize = batteryType !== '' && STANDARD_SIZE_TYPES.includes(batteryType as BatteryType);
  const needsWeight = batteryType !== '' && !STANDARD_SIZE_TYPES.includes(batteryType as BatteryType) && batteryType !== 'knopfzelle';

  // Auto-calculate VEG when type/weight/size changes
  useEffect(() => {
    if (!batteryType || vegManualOverride) return;

    const result = calculateVeg(
      batteryType as BatteryType,
      weightGrams,
      batterySize || undefined
    );

    onChange({
      vegAmount: result.veg,
      inobatArticleNumber: result.inobatArticleNumber,
    });
  }, [batteryType, weightGrams, batterySize, vegManualOverride]);

  const handleTypeChange = (newType: BatteryType | '') => {
    onChange({
      batteryType: newType,
      batterySize: '',
      vegAmount: null,
      inobatArticleNumber: '',
    });
  };

  const handleManualToggle = (checked: boolean) => {
    onChange({ vegManualOverride: checked });
    if (!checked) {
      // Re-calculate when turning off manual override
      if (batteryType) {
        const result = calculateVeg(
          batteryType as BatteryType,
          weightGrams,
          batterySize || undefined
        );
        onChange({
          vegManualOverride: false,
          vegAmount: result.veg,
          inobatArticleNumber: result.inobatArticleNumber,
        });
      }
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
        VEG / INOBAT
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Battery Type */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Batterietyp</label>
          {readOnly ? (
            <p className="text-sm text-gray-900">{batteryType ? BATTERY_TYPE_LABELS[batteryType as BatteryType] : '—'}</p>
          ) : (
            <select
              value={batteryType}
              onChange={e => handleTypeChange(e.target.value as BatteryType | '')}
              className="input-field text-sm"
            >
              <option value="">— Bitte wählen —</option>
              <optgroup label="Gerätebatterien">
                {GERAET_TYPES.map(t => (
                  <option key={t} value={t}>{BATTERY_TYPE_LABELS[t]}</option>
                ))}
              </optgroup>
              <optgroup label="Industriebatterien">
                {INDUSTRIE_TYPES.map(t => (
                  <option key={t} value={t}>{BATTERY_TYPE_LABELS[t]}</option>
                ))}
              </optgroup>
              <optgroup label="Fahrzeugbatterien">
                {FAHRZEUG_TYPES.map(t => (
                  <option key={t} value={t}>{BATTERY_TYPE_LABELS[t]}</option>
                ))}
              </optgroup>
            </select>
          )}
        </div>

        {/* Size selector for standard batteries */}
        {needsSize && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Grösse</label>
            {readOnly ? (
              <p className="text-sm text-gray-900">{batterySize || '—'}</p>
            ) : (
              <select
                value={batterySize}
                onChange={e => onChange({ batterySize: e.target.value })}
                className="input-field text-sm"
              >
                <option value="">— Bitte wählen —</option>
                {(STANDARD_SIZES[batteryType] ?? []).map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Weight for weight-based types */}
        {needsWeight && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gewicht (Gramm)</label>
            {readOnly ? (
              <p className="text-sm text-gray-900">{weightGrams !== null ? `${weightGrams} g` : '—'}</p>
            ) : (
              <input
                type="number"
                value={weightGrams ?? ''}
                onChange={e => onChange({ weightGrams: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="z.B. 350"
                min="0"
                step="1"
                className="input-field text-sm"
              />
            )}
          </div>
        )}
      </div>

      {/* VEG Result */}
      {batteryType && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs font-medium text-green-700 mb-0.5">VEG-Betrag</p>
              <p className="text-xl font-bold text-green-800">
                {vegAmount !== null ? `CHF ${vegAmount.toFixed(2)}` : '—'}
              </p>
            </div>
            {inobatArticleNumber && (
              <div className="text-right">
                <p className="text-xs font-medium text-green-700 mb-0.5">INOBAT-Nr.</p>
                <p className="text-sm font-mono font-semibold text-green-800">{inobatArticleNumber}</p>
              </div>
            )}
          </div>

          {!readOnly && (
            <div className="mt-2 pt-2 border-t border-green-200 flex items-center gap-2">
              <input
                type="checkbox"
                id="vegManual"
                checked={vegManualOverride}
                onChange={e => handleManualToggle(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="vegManual" className="text-xs text-green-700 cursor-pointer">
                Manuell überschreiben
              </label>
              {vegManualOverride && (
                <input
                  type="number"
                  value={vegAmount ?? ''}
                  onChange={e => onChange({ vegAmount: e.target.value ? parseFloat(e.target.value) : null })}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="ml-auto input-field w-28 text-sm py-1"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
