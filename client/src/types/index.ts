export type BatteryType =
  | 'kohle-zink-standard'
  | 'alkali-standard'
  | 'knopfzelle'
  | 'lithium-primaer'
  | 'nicd-standard'
  | 'nimh-standard'
  | 'liion-geraet'
  | 'liion-industrie'
  | 'lifepo4-industrie'
  | 'blei-klein'
  | 'blei-gross'
  | 'ebike-liion'
  | 'blei-fahrzeug'
  | 'lithium-fahrzeug';

export const BATTERY_TYPE_LABELS: Record<BatteryType, string> = {
  'kohle-zink-standard': 'Kohle-Zink Standard',
  'alkali-standard': 'Alkali Standard',
  'knopfzelle': 'Knopfzelle',
  'lithium-primaer': 'Lithium Primär',
  'nicd-standard': 'NiCd Standard',
  'nimh-standard': 'NiMH Standard',
  'liion-geraet': 'Li-Ion Gerät (bis 1kg)',
  'liion-industrie': 'Li-Ion Industrie (ab 1kg)',
  'lifepo4-industrie': 'LiFePO4 Industrie',
  'blei-klein': 'Blei Klein (bis 1kg)',
  'blei-gross': 'Blei Gross (ab 1kg)',
  'ebike-liion': 'E-Bike Li-Ion',
  'blei-fahrzeug': 'Blei Fahrzeug',
  'lithium-fahrzeug': 'Lithium Fahrzeug',
};

export const STANDARD_SIZE_TYPES: BatteryType[] = [
  'kohle-zink-standard',
  'alkali-standard',
  'lithium-primaer',
  'nicd-standard',
  'nimh-standard',
];

export const STANDARD_SIZES: Record<string, string[]> = {
  'kohle-zink-standard': ['AAA', 'AA', '9V', 'C', 'D', '4.5V', '6V/4R25'],
  'alkali-standard': ['AAA', 'AA', '9V', 'C', 'D', '4.5V', '6V/4LR25-25Ah', '6V/4LR25-45Ah'],
  'lithium-primaer': ['CR03', 'CR2', 'CR123A', '9V', 'AA', 'CRV3', 'CRP2', '2CR5'],
  'nicd-standard': ['AAA', 'AA', '9V', 'C', 'D', 'C-Profi', 'D-Profi'],
  'nimh-standard': ['AAA', 'AA', '9V', 'C', 'D'],
};

export interface MarketPrice {
  id: string;
  source: string;
  price: number;
}

export interface PriceTier {
  minQty: number;
  maxQty: number | null;
  markup: number;
}

export interface PriceCategory {
  tiers: PriceTier[];
}

export interface Article {
  id: string;
  name: string;
  articleNumber: string;
  ean: string;
  purchasePrice: number;
  batteryType: BatteryType | '';
  batterySize: string;
  weightGrams: number | null;
  vegAmount: number | null;
  vegManualOverride: boolean;
  inobatArticleNumber: string;
  marketPrices: MarketPrice[];
  windowPriceCategory: PriceCategory;
  businessPriceCategory: PriceCategory;
  shopPflege: boolean;   // Im Webshop eingepflegt
  erpPflege: boolean;    // Im ERP eingepflegt
}

export interface Calculation {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  sessionId: string;
  articles: Article[];
}

export interface CalculationSummary {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  articleCount: number;
}

export function createDefaultArticle(): Article {
  return {
    id: crypto.randomUUID(),
    name: '',
    articleNumber: '',
    ean: '',
    purchasePrice: 0,
    batteryType: '',
    batterySize: '',
    weightGrams: null,
    vegAmount: null,
    vegManualOverride: false,
    inobatArticleNumber: '',
    marketPrices: [],
    windowPriceCategory: {
      tiers: [
        { minQty: 1, maxQty: 9, markup: 80 },
        { minQty: 10, maxQty: 49, markup: 65 },
        { minQty: 50, maxQty: null, markup: 50 },
      ],
    },
    businessPriceCategory: {
      tiers: [
        { minQty: 1, maxQty: 9, markup: 55 },
        { minQty: 10, maxQty: 49, markup: 40 },
        { minQty: 50, maxQty: null, markup: 25 },
      ],
    },
    shopPflege: false,
    erpPflege: false,
  };
}
