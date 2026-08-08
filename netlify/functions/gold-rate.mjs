const SOURCE_URL = 'https://drhint.com/api/public/hooks/gold-rates';
let cache = null;
const CACHE_MS = 5 * 60 * 1000;

export async function handler() {
  if (cache && Date.now() - cache.cachedAt < CACHE_MS) {
    return response(200, cache.payload);
  }

  try {
    const upstream = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyPortfolioGoldRate/1.0)',
        Accept: 'application/json',
      },
    });
    if (!upstream.ok) throw new Error(`Gold feed returned ${upstream.status}`);
    const data = await upstream.json();
    const perTola24kPkr = Number(data.perTola24kPkr);
    const perGram24kPkr = Number(data.perGram24kPkr);
    if (
      !Number.isFinite(perTola24kPkr) ||
      !Number.isFinite(perGram24kPkr) ||
      perTola24kPkr < 1000 ||
      perGram24kPkr < 100
    ) {
      throw new Error('Gold feed returned an invalid rate');
    }

    const payload = {
      perTola24kPkr,
      perGram24kPkr,
      karat: '24K',
      currency: 'PKR',
      unit: 'tola',
      updatedAt: data.fetchedAt || new Date().toISOString(),
      source: 'drhint.com',
    };
    cache = { cachedAt: Date.now(), payload };
    return response(200, payload);
  } catch (error) {
    return response(502, { error: error.message || 'Gold rate unavailable' });
  }
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}
