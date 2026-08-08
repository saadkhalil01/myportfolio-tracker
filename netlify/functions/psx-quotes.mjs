/**
 * Batch PSX quotes from the public data portal.
 * GET /.netlify/functions/psx-quotes?symbols=EFERT,MLCF,SAZEW
 */
const cache = new Map();
const CACHE_MS = 60_000;

function normalizeSymbol(raw = '') {
  return String(raw)
    .trim()
    .toUpperCase()
    .replace(/\.PK$/i, '')
    .replace(/[^A-Z0-9]/g, '');
}

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'MyPortfolioQuoteBot/1.0' } });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

async function quoteFromTimeseries(symbol) {
  const [intra, eod] = await Promise.all([
    fetchJson(`https://dps.psx.com.pk/timeseries/int/${symbol}`),
    fetchJson(`https://dps.psx.com.pk/timeseries/eod/${symbol}`),
  ]);

  const ticks = Array.isArray(intra?.data) ? intra.data : [];
  const days = Array.isArray(eod?.data) ? eod.data : [];
  if (!ticks.length && !days.length) return null;

  const price = num(ticks[0]?.[1]) ?? num(days[0]?.[1]);
  if (price == null) return null;

  // Prior close: second EOD row when available
  const prevClose = num(days[1]?.[1]) ?? num(days[0]?.[1]);
  const change = prevClose != null ? price - prevClose : null;
  const changePct = prevClose ? (change / prevClose) * 100 : null;

  return {
    symbol,
    price,
    change,
    changePct,
    prevClose,
    source: ticks.length ? 'intraday' : 'eod',
  };
}

async function quoteFromHtml(symbol) {
  const res = await fetch(`https://dps.psx.com.pk/company/${symbol}`, {
    headers: { 'User-Agent': 'MyPortfolioQuoteBot/1.0' },
  });
  if (!res.ok) return null;
  const html = await res.text();

  const priceM = html.match(/quote__close">\s*Rs\.?\s*([0-9,.]+)/i);
  const changeM = html.match(/change__value">\s*([-+0-9,.]+)/i);
  const pctM = html.match(/change__percent">\s*\(([^)]+)\)/i);
  const ldcpM = html.match(/LDCP<\/div>\s*<div class="stats_value">([0-9,.]+)/i);

  const price = num(priceM?.[1]);
  if (price == null) return null;

  const change = num(changeM?.[1]);
  const pctRaw = pctM?.[1]?.replace(/%/g, '');
  const changePct = num(pctRaw);

  return {
    symbol,
    price,
    change,
    changePct,
    prevClose: num(ldcpM?.[1]),
    source: 'html',
  };
}

async function getQuote(symbol) {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.quote;

  let quote = null;
  try {
    quote = (await quoteFromTimeseries(symbol)) || (await quoteFromHtml(symbol));
  } catch {
    quote = null;
  }

  cache.set(symbol, { at: Date.now(), quote });
  return quote;
}

export async function handler(event) {
  const raw =
    event.queryStringParameters?.symbols ||
    event.queryStringParameters?.symbol ||
    '';
  const symbols = [
    ...new Set(
      String(raw)
        .split(/[,|\s]+/)
        .map(normalizeSymbol)
        .filter((s) => s.length >= 2)
    ),
  ].slice(0, 40);

  if (!symbols.length) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Pass ?symbols=EFERT,MLCF' }),
    };
  }

  try {
    const quotes = await Promise.all(symbols.map(getQuote));
    const data = {};
    symbols.forEach((sym, i) => {
      if (quotes[i]) data[sym] = quotes[i];
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        updatedAt: new Date().toISOString(),
        data,
      }),
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Quote fetch failed' }),
    };
  }
}
