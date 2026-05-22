import type { BatteryType } from '../types';

// INOBAT Tarif 2026

const KOHLE_ZINK: Record<string, number> = {
  'AAA': 0.05, 'AA': 0.05, '9V': 0.10, 'C': 0.15, 'D': 0.30, '4.5V': 0.35, '6V/4R25': 1.80
};

const ALKALI_STANDARD: Record<string, number> = {
  'AAA': 0.05, 'AA': 0.10, '9V': 0.15, 'C': 0.20, 'D': 0.40, '4.5V': 0.50,
  '6V/4LR25-25Ah': 1.50, '6V/4LR25-45Ah': 2.25
};

const LITHIUM_PRIMAER: Record<string, number> = {
  'CR03': 0.05, 'CR2': 0.05, 'CR123A': 0.05, '9V': 0.10, 'AA': 0.10, 'CRV3': 0.10, 'CRP2': 0.10, '2CR5': 0.15
};

const NICD_STANDARD: Record<string, number> = {
  'AAA': 0.05, 'AA': 0.10, '9V': 0.15, 'C': 0.20, 'D': 0.20, 'C-Profi': 0.25, 'D-Profi': 0.45
};

const NIMH_STANDARD: Record<string, number> = {
  'AAA': 0.05, 'AA': 0.10, '9V': 0.15, 'C': 0.20, 'D': 0.35
};

const LIION_GERAET_TIERS: Array<{ min: number; max: number; veg: number }> = [
  { min: 1, max: 24, veg: 0.05 }, { min: 25, max: 49, veg: 0.05 },
  { min: 50, max: 74, veg: 0.10 }, { min: 75, max: 99, veg: 0.15 },
  { min: 100, max: 149, veg: 0.20 }, { min: 150, max: 199, veg: 0.30 },
  { min: 200, max: 249, veg: 0.35 }, { min: 250, max: 299, veg: 0.45 },
  { min: 300, max: 349, veg: 0.50 }, { min: 350, max: 399, veg: 0.60 },
  { min: 400, max: 449, veg: 0.70 }, { min: 450, max: 499, veg: 0.75 },
  { min: 500, max: 549, veg: 0.85 }, { min: 550, max: 599, veg: 0.90 },
  { min: 600, max: 649, veg: 1.00 }, { min: 650, max: 699, veg: 1.10 },
  { min: 700, max: 749, veg: 1.15 }, { min: 750, max: 799, veg: 1.25 },
  { min: 800, max: 849, veg: 1.30 }, { min: 850, max: 899, veg: 1.40 },
  { min: 900, max: 949, veg: 1.50 }, { min: 950, max: 1000, veg: 1.55 },
];

const LIION_INDUSTRIE_TIERS: Array<{ min: number; max: number; veg: number }> = [
  { min: 1001, max: 2000, veg: 3.10 }, { min: 2001, max: 3000, veg: 4.65 },
  { min: 3001, max: 4000, veg: 6.20 }, { min: 4001, max: 5000, veg: 7.75 },
  { min: 5001, max: 7500, veg: 11.65 }, { min: 7501, max: 10000, veg: 15.50 },
  { min: 10001, max: 15000, veg: 23.25 }, { min: 15001, max: 20000, veg: 31.00 },
  { min: 20001, max: 30000, veg: 46.50 }, { min: 30001, max: 50000, veg: 77.50 },
  { min: 50001, max: Infinity, veg: 155.00 },
];

const LIFEPO4_INDUSTRIE_TIERS: Array<{ min: number; max: number; veg: number }> = [
  { min: 1001, max: 2000, veg: 1.55 }, { min: 2001, max: 3000, veg: 2.35 },
  { min: 3001, max: 4000, veg: 3.10 }, { min: 4001, max: 5000, veg: 3.90 },
  { min: 5001, max: 7500, veg: 5.80 }, { min: 7501, max: 10000, veg: 7.75 },
  { min: 10001, max: 15000, veg: 11.65 }, { min: 15001, max: 20000, veg: 15.50 },
  { min: 20001, max: 30000, veg: 23.25 }, { min: 30001, max: 50000, veg: 38.75 },
  { min: 50001, max: Infinity, veg: 77.50 },
];

const BLEI_KLEIN_TIERS: Array<{ min: number; max: number; veg: number }> = [
  { min: 1, max: 100, veg: 0.05 }, { min: 101, max: 200, veg: 0.10 },
  { min: 201, max: 300, veg: 0.15 }, { min: 301, max: 400, veg: 0.20 },
  { min: 401, max: 500, veg: 0.25 }, { min: 501, max: 600, veg: 0.30 },
  { min: 601, max: 700, veg: 0.35 }, { min: 701, max: 800, veg: 0.40 },
  { min: 801, max: 900, veg: 0.45 }, { min: 901, max: 1000, veg: 0.50 },
];

const BLEI_GROSS_TIERS: Array<{ min: number; max: number; veg: number }> = [
  { min: 1001, max: 3000, veg: 1.50 }, { min: 3001, max: 7000, veg: 3.50 },
  { min: 7001, max: 15000, veg: 7.50 }, { min: 15001, max: 25000, veg: 12.50 },
  { min: 25001, max: 50000, veg: 25.00 }, { min: 50001, max: Infinity, veg: 50.00 },
];

const EBIKE_TIERS: Array<{ min: number; max: number; veg: number }> = [
  { min: 0, max: 550, veg: 0.55 }, { min: 551, max: 1000, veg: 1.20 },
  { min: 1001, max: 2000, veg: 3.10 }, { min: 2001, max: 3000, veg: 4.65 },
  { min: 3001, max: 4000, veg: 6.20 }, { min: 4001, max: 5000, veg: 7.75 },
  { min: 5001, max: 7500, veg: 11.65 }, { min: 7501, max: Infinity, veg: 15.50 },
];

const BLEI_FAHRZEUG_TIERS: Array<{ min: number; max: number; veg: number }> = [
  { min: 1, max: 2000, veg: 1.00 }, { min: 2001, max: 5000, veg: 2.50 },
  { min: 5001, max: 10000, veg: 5.00 }, { min: 10001, max: 20000, veg: 10.00 },
  { min: 20001, max: 30000, veg: 15.00 }, { min: 30001, max: Infinity, veg: 25.00 },
];

const LITHIUM_FAHRZEUG_TIERS: Array<{ min: number; max: number; veg: number }> = [
  { min: 1, max: 1000, veg: 1.55 }, { min: 1001, max: 2000, veg: 3.10 },
  { min: 2001, max: 5000, veg: 7.75 }, { min: 5001, max: 10000, veg: 15.50 },
  { min: 10001, max: Infinity, veg: 31.00 },
];

function findTier(tiers: Array<{ min: number; max: number; veg: number }>, weight: number): number | null {
  const tier = tiers.find(t => weight >= t.min && weight <= t.max);
  return tier ? tier.veg : null;
}

export interface VegResult {
  veg: number | null;
  inobatArticleNumber: string;
}

export function calculateVeg(
  batteryType: BatteryType,
  weightGrams: number | null,
  batterySize?: string
): VegResult {
  switch (batteryType) {
    case 'knopfzelle':
      return { veg: 0.03, inobatArticleNumber: '61000' };

    case 'kohle-zink-standard': {
      if (batterySize && KOHLE_ZINK[batterySize] !== undefined) {
        return { veg: KOHLE_ZINK[batterySize], inobatArticleNumber: '10000' };
      }
      return { veg: null, inobatArticleNumber: '10000' };
    }

    case 'alkali-standard': {
      if (batterySize && ALKALI_STANDARD[batterySize] !== undefined) {
        return { veg: ALKALI_STANDARD[batterySize], inobatArticleNumber: '20000' };
      }
      return { veg: null, inobatArticleNumber: '20000' };
    }

    case 'lithium-primaer': {
      if (batterySize && LITHIUM_PRIMAER[batterySize] !== undefined) {
        return { veg: LITHIUM_PRIMAER[batterySize], inobatArticleNumber: '30000' };
      }
      return { veg: null, inobatArticleNumber: '30000' };
    }

    case 'nicd-standard': {
      if (batterySize && NICD_STANDARD[batterySize] !== undefined) {
        return { veg: NICD_STANDARD[batterySize], inobatArticleNumber: '50000' };
      }
      return { veg: null, inobatArticleNumber: '50000' };
    }

    case 'nimh-standard': {
      if (batterySize && NIMH_STANDARD[batterySize] !== undefined) {
        return { veg: NIMH_STANDARD[batterySize], inobatArticleNumber: '55000' };
      }
      return { veg: null, inobatArticleNumber: '55000' };
    }

    case 'liion-geraet': {
      if (weightGrams === null) return { veg: null, inobatArticleNumber: '62000' };
      return { veg: findTier(LIION_GERAET_TIERS, weightGrams), inobatArticleNumber: '62000' };
    }

    case 'liion-industrie': {
      if (weightGrams === null) return { veg: null, inobatArticleNumber: '86000' };
      return { veg: findTier(LIION_INDUSTRIE_TIERS, weightGrams), inobatArticleNumber: '86000' };
    }

    case 'lifepo4-industrie': {
      if (weightGrams === null) return { veg: null, inobatArticleNumber: '86100' };
      return { veg: findTier(LIFEPO4_INDUSTRIE_TIERS, weightGrams), inobatArticleNumber: '86100' };
    }

    case 'blei-klein': {
      if (weightGrams === null) return { veg: null, inobatArticleNumber: '87100' };
      return { veg: findTier(BLEI_KLEIN_TIERS, weightGrams), inobatArticleNumber: '87100' };
    }

    case 'blei-gross': {
      if (weightGrams === null) return { veg: null, inobatArticleNumber: '87300' };
      return { veg: findTier(BLEI_GROSS_TIERS, weightGrams), inobatArticleNumber: '87300' };
    }

    case 'ebike-liion': {
      if (weightGrams === null) return { veg: null, inobatArticleNumber: '88000' };
      return { veg: findTier(EBIKE_TIERS, weightGrams), inobatArticleNumber: '88000' };
    }

    case 'blei-fahrzeug': {
      if (weightGrams === null) return { veg: null, inobatArticleNumber: '91000' };
      return { veg: findTier(BLEI_FAHRZEUG_TIERS, weightGrams), inobatArticleNumber: '91000' };
    }

    case 'lithium-fahrzeug': {
      if (weightGrams === null) return { veg: null, inobatArticleNumber: '94000' };
      return { veg: findTier(LITHIUM_FAHRZEUG_TIERS, weightGrams), inobatArticleNumber: '94000' };
    }

    default:
      return { veg: null, inobatArticleNumber: '' };
  }
}
