import { Router } from 'express';

const router = Router();

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

router.post('/', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error: 'ANTHROPIC_API_KEY nicht konfiguriert. Bitte die Umgebungsvariable setzen (lokal: $env:ANTHROPIC_API_KEY="sk-ant-..." in PowerShell; auf Render: Secret Environment Variable).',
    });
    return;
  }

  const { suchbegriff, ersatztyp, aktuellerVkChf, eurChfKurs = 0.96 } = req.body as {
    suchbegriff?: string;
    ersatztyp?: string;
    aktuellerVkChf?: number;
    eurChfKurs?: number;
  };

  if (!suchbegriff?.trim()) {
    res.status(400).json({ error: 'Suchbegriff fehlt' });
    return;
  }

  const prompt = buildPrompt(suchbegriff.trim(), ersatztyp?.trim(), aktuellerVkChf, eurChfKurs ?? 0.96);

  try {
    const apiRes = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!apiRes.ok) {
      const errBody = await apiRes.json().catch(() => ({})) as { error?: { message?: string } };
      const errMsg = errBody?.error?.message ?? apiRes.statusText;
      res.status(apiRes.status).json({ error: `Claude API Fehler: ${errMsg}` });
      return;
    }

    const data = await apiRes.json() as { content?: Array<{ type: string; text?: string }> };

    const textBlocks = (data.content ?? [])
      .filter(b => b.type === 'text')
      .map(b => b.text ?? '');

    if (textBlocks.length === 0) {
      res.status(502).json({ error: 'Keine Textantwort von Claude erhalten' });
      return;
    }

    const fullText = textBlocks.join('\n');
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(502).json({ error: 'Kein gültiges JSON in Claude-Antwort gefunden', raw: fullText.slice(0, 500) });
      return;
    }

    const result = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    // Ensure required fields
    result.recherche_datum = result.recherche_datum ?? new Date().toISOString().split('T')[0];
    result.suchbegriff = result.suchbegriff ?? suchbegriff;
    result.eur_chf_kurs = result.eur_chf_kurs ?? (eurChfKurs ?? 0.96);
    result.ampel = result.ampel ?? 'unbekannt';
    if (!Array.isArray(result.anbieter)) result.anbieter = [];

    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
    console.error('Market research error:', err);
    res.status(500).json({ error: msg });
  }
});

function buildPrompt(
  suchbegriff: string,
  ersatztyp: string | undefined,
  aktuellerVkChf: number | undefined,
  eurChfKurs: number,
): string {
  const today = new Date().toISOString().split('T')[0];
  const vkLine = aktuellerVkChf
    ? `\nAKTUELLER CONTREL VK: CHF ${aktuellerVkChf.toFixed(2)} (inkl. VEG)`
    : '';
  const ersatzLine = ersatztyp ? `\nALTERNATIVE / ERSATZTYP: ${ersatztyp}` : '';

  return `Du bist ein Preisrecherche-Assistent für Contrel AG, ein Schweizer B2B-Händler für Batterien, Akkus und Ladegeräte.

Recherchiere die aktuellen Marktpreise für folgendes Produkt im Schweizer und deutschen Onlinehandel:

ARTIKEL: ${suchbegriff}${ersatzLine}${vkLine}
EUR/CHF KURS: ${eurChfKurs}

AUFGABE:
Durchsuche folgende Online-Händler in dieser Reihenfolge:

Priorität A (Schweiz, bevorzugt – Preise direkt in CHF):
- Galaxus.ch / Digitec.ch
- Toppreise.ch (Preisvergleich Schweiz)
- Ricardo.ch

Priorität B (Deutschland – EUR mit Kurs ${eurChfKurs} in CHF umrechnen):
- Amazon.de
- Batteryworld.de
- Batterieexperte.de
- Conrad.de
- Voelkner.de
- Reichelt.de
- Jakob-elektronik.de

WICHTIG:
- Suche nach dem Originalprodukt; bei Nichtverfügbarkeit nach kompatiblen Alternativen
- Netto-Preise (exkl. MWST) bevorzugen wo angegeben
- B2B-/Staffelpreise berücksichtigen falls verfügbar

Antworte AUSSCHLIESSLICH mit folgendem JSON-Objekt – kein Text davor oder danach:
{
  "tiefstpreis_chf": <günstigstes Angebot netto CHF oder null>,
  "durchschnitt_chf": <Durchschnitt aller Preise netto CHF oder null>,
  "marktpreis_chf": <repräsentativer Marktpreis / Median netto CHF oder null>,
  "premiumpreis_chf": <teuerstes seriöses Angebot netto CHF oder null>,
  "empfehlung_vk_chf": <Empfehlung Contrel VK leicht unter Marktpreis auf 0.05 gerundet, oder null>,
  "ampel": ${aktuellerVkChf ? `"gruen" wenn VK <= Marktpreis, "gelb" wenn VK bis +15% über Marktpreis, "rot" wenn VK > +15% über Marktpreis, sonst "unbekannt"` : `"unbekannt"`},
  "anbieter": [
    {
      "name": "<Händlername>",
      "preis_netto_chf": <Preis netto CHF oder null>,
      "verfuegbar": <true/false>,
      "ursprung": "CHF" oder "EUR",
      "preis_original": <Originalpreis in EUR falls ursprung=EUR, sonst null>,
      "prioritaet": "A" oder "B",
      "hinweis": "<optional: z.B. Kompatibles Produkt oder Staffelpreis ab 10 Stk>"
    }
  ],
  "hinweis": "<optionale Gesamtanmerkung oder null>",
  "recherche_datum": "${today}",
  "suchbegriff": "${suchbegriff}",
  "eur_chf_kurs": ${eurChfKurs}
}`;
}

export default router;
