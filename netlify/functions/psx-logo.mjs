/**
 * Resolve a PSX ticker → company website (from dps.psx.com.pk) → favicon image.
 * GET /.netlify/functions/psx-logo?symbol=MLCF
 */
const memory = new Map();

function normalizeSymbol(raw = '') {
  return String(raw)
    .trim()
    .toUpperCase()
    .replace(/\.PK$/i, '')
    .replace(/[^A-Z0-9]/g, '');
}

function domainFromWebsite(url = '') {
  try {
    const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const host = new URL(withProto).hostname.replace(/^www\./i, '');
    return host || null;
  } catch {
    return null;
  }
}

async function websiteForSymbol(symbol) {
  if (memory.has(symbol)) return memory.get(symbol);

  const res = await fetch(`https://dps.psx.com.pk/company/${symbol}`, {
    headers: { 'User-Agent': 'MyPortfolioLogoBot/1.0' },
  });
  if (!res.ok) {
    memory.set(symbol, null);
    return null;
  }

  const html = await res.text();
  const match = html.match(/WEBSITE<\/div>\s*<p>\s*<a[^>]+href=["']([^"']+)["']/i);
  const domain = match ? domainFromWebsite(match[1]) : null;
  memory.set(symbol, domain);
  return domain;
}

function faviconCandidates(domain) {
  return [
    `https://icon.horse/icon/${domain}`,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  ];
}

async function fetchFavicon(domain) {
  for (const url of faviconCandidates(domain)) {
    try {
      const img = await fetch(url, { headers: { 'User-Agent': 'MyPortfolioLogoBot/1.0' } });
      if (!img.ok) continue;
      const type = img.headers.get('content-type') || '';
      if (!type.includes('image') && !type.includes('icon')) continue;
      const bytes = Buffer.from(await img.arrayBuffer());
      // Skip tiny / empty placeholders
      if (bytes.length < 200) continue;
      return { bytes, type: type.split(';')[0] || 'image/png' };
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function handler(event) {
  const symbol = normalizeSymbol(
    event.queryStringParameters?.symbol || event.path?.split('/').pop() || ''
  );

  if (!symbol || symbol.length < 2) {
    return { statusCode: 400, body: 'Missing symbol' };
  }

  try {
    const domain = await websiteForSymbol(symbol);
    if (!domain) {
      return {
        statusCode: 404,
        headers: { 'Cache-Control': 'public, max-age=3600' },
        body: 'No website',
      };
    }

    const favicon = await fetchFavicon(domain);
    if (!favicon) {
      return { statusCode: 404, body: 'Favicon missing' };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': favicon.type,
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
      body: favicon.bytes.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 502, body: err.message || 'Lookup failed' };
  }
}
