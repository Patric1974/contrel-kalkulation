export interface MarktpreisAnbieter {
  name: string;
  land: 'CH' | 'DE';
  waehrung: 'CHF' | 'EUR';
  prioritaet: 'A' | 'B';
  url: string;
  kategorien: string[];
}

export const MARKTPREIS_ANBIETER: MarktpreisAnbieter[] = [
  // Priorität A — Schweiz
  { name: 'Galaxus.ch / Digitec.ch', land: 'CH', waehrung: 'CHF', prioritaet: 'A', url: 'galaxus.ch', kategorien: ['Batterien', 'Akkus', 'Ladegeräte'] },
  { name: 'Toppreise.ch', land: 'CH', waehrung: 'CHF', prioritaet: 'A', url: 'toppreise.ch', kategorien: ['Preisvergleich CH'] },
  { name: 'Ricardo.ch', land: 'CH', waehrung: 'CHF', prioritaet: 'A', url: 'ricardo.ch', kategorien: ['Markenartikel'] },
  // Priorität B — Deutschland
  { name: 'Amazon.de', land: 'DE', waehrung: 'EUR', prioritaet: 'B', url: 'amazon.de', kategorien: ['Batterien', 'Akkus'] },
  { name: 'Batteryworld.de', land: 'DE', waehrung: 'EUR', prioritaet: 'B', url: 'batteryworld.de', kategorien: ['Spezialhändler'] },
  { name: 'Batterieexperte.de', land: 'DE', waehrung: 'EUR', prioritaet: 'B', url: 'batterieexperte.de', kategorien: ['Spezialhändler'] },
  { name: 'Conrad.de', land: 'DE', waehrung: 'EUR', prioritaet: 'B', url: 'conrad.de', kategorien: ['Elektronik'] },
  { name: 'Voelkner.de', land: 'DE', waehrung: 'EUR', prioritaet: 'B', url: 'voelkner.de', kategorien: ['Elektronik'] },
  { name: 'Reichelt.de', land: 'DE', waehrung: 'EUR', prioritaet: 'B', url: 'reichelt.de', kategorien: ['Elektronik'] },
  { name: 'Jakob-elektronik.de', land: 'DE', waehrung: 'EUR', prioritaet: 'B', url: 'jakob-elektronik.de', kategorien: ['Batterien'] },
];

export const ANBIETER_NAMEN_LOADING = MARKTPREIS_ANBIETER.map(a => a.name.split(' ')[0]);
