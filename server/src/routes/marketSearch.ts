import { Router, Request, Response } from 'express';

const router = Router();

interface SearchResult {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  prices: ExtractedPrice[];
}

interface ExtractedPrice {
  raw: string;
  value: number;
}

function extractPrices(text: string): ExtractedPrice[] {
  const cleaned = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const patterns = [
    /CHF\s*(\d{1,4})[.,](\d{2})/gi,
    /Fr\.\s*(\d{1,4})[.,](\d{2})/gi,
    /(\d{1,4})[.,](\d{2})\s*CHF/gi,
    /(\d{1,4})[.,](\d{2})\s*Fr\./gi,
  ];
  const found: ExtractedPrice[] = [];
  const seen = new Set<number>();
  for (const pattern of patterns) {
    let m;
    pattern.lastIndex = 0;
    while ((m = pattern.exec(cleaned)) !== null) {
      const value = parseFloat(`${m[1]}.${m[2]}`);
      if (!isNaN(value) && value >= 0.50 && value < 9999 && !seen.has(value)) {
        seen.add(value);
        found.push({ raw: m[0].trim(), value });
      }
    }
  }
  return found.sort((a, b) => a.value - b.value).slice(0, 3);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

const NAV_TITLES = /^(Home|Start|Impressum|Kontakt|AGB|Datenschutz|Login|Anmelden|Warenkorb|Merkliste|Vergleich|Suche|Kategorien|Newsletter|Hilfe|FAQ|DE|FR|IT|EN|\d+|Deutsch|Français|Italiano)$/i;
const NAV_PATHS = /\/(impressum|kontakt|agb|datenschutz|faq|hilfe|newsletter|login|register|konto|account|warenkorb|cart|checkout|vergleich|merkliste|wishlist|brands?|marken?|kategorien?|categor|ueber-uns|about)/i;

// Parse toppreise.ch — broad internal link matching, filter by CHF price context
function parseToppreise(html: string): SearchResult[] {
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  // Match any site-internal relative link
  const linkRe = /<a\b[^>]+href="(\/[^"#?]{5,})"[^>]*>([\s\S]{0,200}?)<\/a>/gi;

  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const relUrl = m[1];
    const title = stripHtml(m[2]).trim();

    if (title.length < 4 || title.length > 150) continue;
    if (NAV_TITLES.test(title)) continue;
    if (NAV_PATHS.test(relUrl)) continue;

    const url = 'https://www.toppreise.ch' + relUrl;
    if (seen.has(url)) continue;
    seen.add(url);

    const pos = m.index;
    const context = html.substring(Math.max(0, pos - 400), pos + 800);
    const prices = extractPrices(context);
    const snippet = stripHtml(context).substring(0, 200);

    results.push({ title, url, domain: 'toppreise.ch', snippet, prices });
    if (results.length >= 30) break;
  }

  // Sort: results with prices first
  results.sort((a, b) => b.prices.length - a.prices.length);
  return results.slice(0, 20);
}

// DuckDuckGo HTML fallback
async function searchDDG(q: string): Promise<SearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q + ' CHF Preis Schweiz')}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'de-CH,de;q=0.9',
        'Referer': 'https://duckduckgo.com/',
      },
      signal: AbortSignal.timeout(10000),
    });

    const html = await r.text();
    console.log(`[market-search] DDG status=${r.status} htmlLen=${html.length}`);

    const results: SearchResult[] = [];
    const seen = new Set<string>();

    // DDG HTML result blocks
    const blockRe = /<div[^>]+class="[^"]*results_links[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]+class="[^"]*result[^"]*"|$)/gi;
    const titleLinkRe = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i;
    const snippetRe = /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i;

    let block;
    while ((block = blockRe.exec(html)) !== null && results.length < 15) {
      const content = block[1];
      const linkMatch = titleLinkRe.exec(content);
      if (!linkMatch) continue;

      let url = linkMatch[1];
      // DDG wraps URLs — extract actual URL
      if (url.includes('duckduckgo.com/l/')) {
        const uddg = /uddg=([^&]+)/.exec(url);
        if (uddg) url = decodeURIComponent(uddg[1]);
      }
      if (!url.startsWith('http') || seen.has(url)) continue;
      seen.add(url);

      const title = stripHtml(linkMatch[2]).trim();
      const snippetMatch = snippetRe.exec(content);
      const snippet = snippetMatch ? stripHtml(snippetMatch[1]) : '';
      const prices = extractPrices(title + ' ' + snippet);
      const domain = getDomain(url);

      results.push({ title, url, domain, snippet: snippet.substring(0, 200), prices });
    }

    // Fallback: if no structured results found, try any link with nearby price
    if (results.length === 0) {
      const anyLinkRe = /<a[^>]+href="(https?:\/\/[^"#]{10,})"[^>]*>([^<]{5,80})<\/a>/gi;
      let m2;
      while ((m2 = anyLinkRe.exec(html)) !== null && results.length < 20) {
        const url = m2[1];
        const title = m2[2].trim();
        if (seen.has(url) || url.includes('duckduckgo.com')) continue;
        seen.add(url);
        const pos = m2.index;
        const ctx = html.substring(pos, pos + 400);
        const prices = extractPrices(ctx);
        if (prices.length === 0) continue;
        results.push({ title, url, domain: getDomain(url), snippet: '', prices });
      }
    }

    return results;
  } catch (e) {
    console.error('[market-search] DDG error:', e);
    return [];
  }
}

// GET /api/market-search/debug
router.get('/debug', async (req: Request, res: Response) => {
  const q = (req.query.q as string || 'Energizer AA').trim();
  const source = (req.query.source as string || 'toppreise').toLowerCase();
  try {
    let html = '';
    let fetchUrl = '';

    if (source === 'ddg') {
      fetchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q + ' CHF Preis Schweiz')}`;
    } else {
      fetchUrl = `https://www.toppreise.ch/suche.php?lang=de&q=${encodeURIComponent(q)}`;
    }

    const r = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'de-CH,de;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
    html = await r.text();

    const parsed = source === 'ddg' ? await searchDDG(q) : parseToppreise(html);

    res.type('text/plain').send(
      `Source: ${source}\nURL: ${fetchUrl}\nStatus: ${r.status}\nLength: ${html.length}\n` +
      `Parsed: ${parsed.length} results, ${parsed.filter(x => x.prices.length > 0).length} with prices\n\n` +
      `First 5 results:\n${JSON.stringify(parsed.slice(0, 5), null, 2)}\n\n` +
      `=== HTML Sample (first 6000 chars) ===\n${html.substring(0, 6000)}`
    );
  } catch (e) {
    res.type('text/plain').send(String(e));
  }
});

// GET /api/market-search?q=...
router.get('/', async (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim();
  if (!q) { res.status(400).json({ error: 'Suchanfrage fehlt' }); return; }

  try {
    // Primary: toppreise.ch
    const toppreiseUrl = `https://www.toppreise.ch/suche.php?lang=de&q=${encodeURIComponent(q)}`;
    const r = await fetch(toppreiseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'de-CH,de;q=0.9',
        'Referer': 'https://www.toppreise.ch/',
      },
      signal: AbortSignal.timeout(12000),
    });

    const html = await r.text();
    console.log(`[market-search] toppreise q="${q}" status=${r.status} htmlLen=${html.length}`);

    let results = parseToppreise(html);
    const toppreiseWithPrices = results.filter(x => x.prices.length > 0).length;
    console.log(`[market-search] toppreise parsed ${results.length} results, ${toppreiseWithPrices} with prices`);

    // Fallback to DDG if toppreise yielded no prices
    if (toppreiseWithPrices === 0) {
      console.log('[market-search] no prices from toppreise, trying DDG fallback...');
      const ddgResults = await searchDDG(q);
      console.log(`[market-search] DDG: ${ddgResults.length} results, ${ddgResults.filter(x => x.prices.length > 0).length} with prices`);
      results = [...ddgResults, ...results];
    }

    const allPrices = results.flatMap(r => r.prices.map(p => p.value));
    const summary = allPrices.length > 0 ? {
      min: Math.min(...allPrices),
      max: Math.max(...allPrices),
      avg: Math.round((allPrices.reduce((a, b) => a + b, 0) / allPrices.length) * 100) / 100,
      count: allPrices.length,
    } : null;

    res.json({ results, summary, query: q });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[market-search] error:', msg);
    res.status(502).json({ error: `Suche fehlgeschlagen: ${msg}`, results: [] });
  }
});

export default router;
