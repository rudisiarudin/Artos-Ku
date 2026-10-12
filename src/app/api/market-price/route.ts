import { NextRequest, NextResponse } from 'next/server';

// Fallback benchmark rates for major IDX stocks when offline/off-hours
const IDX_BENCHMARK: Record<string, number> = {
  BBCA: 10250,
  BBRI: 4850,
  BMRI: 6725,
  BBNI: 5350,
  TLKM: 2890,
  ASII: 4980,
  GOTO: 68,
  AMMN: 9800,
  ICBP: 11450,
  UNVR: 2150,
  BREN: 6925,
  ADRO: 3680,
  ANTM: 1540,
  MDKA: 2360,
  PGAS: 1515,
};

// Known Crypto Coingecko ID map fallback
const CRYPTO_COINGECKO_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  USDT: 'tether',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  AVAX: 'avalanche-2',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawTicker = searchParams.get('ticker') || '';
  const assetType = searchParams.get('type') || 'stock';

  const ticker = rawTicker.toUpperCase().trim();
  if (!ticker) {
    return NextResponse.json({ success: false, error: 'Ticker is required' }, { status: 400 });
  }

  // 1. CRYPTO PRICE FETCH (Primary: Indodax, Secondary: CoinGecko)
  if (assetType === 'crypto' || CRYPTO_COINGECKO_MAP[ticker]) {
    try {
      // Primary: Indodax public ticker API
      const indodaxRes = await fetch(
        `https://indodax.com/api/ticker/${ticker.toLowerCase()}idr`,
        {
          headers: { 'User-Agent': 'ArtosKu/1.0' },
          next: { revalidate: 30 },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (indodaxRes.ok) {
        const indodaxData = await indodaxRes.json();
        const lastPrice = parseFloat(indodaxData?.ticker?.last);
        if (!isNaN(lastPrice) && lastPrice > 0) {
          const high = parseFloat(indodaxData.ticker.high) || lastPrice;
          const low = parseFloat(indodaxData.ticker.low) || lastPrice;
          const approxChange = high > low ? ((lastPrice - low) / low) * 100 : 0;

          return NextResponse.json({
            success: true,
            ticker,
            price: lastPrice,
            currency: 'IDR',
            change24h: approxChange,
            source: 'indodax',
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch {
      // Fallback to CoinGecko
    }

    // Secondary: CoinGecko
    const cgId = CRYPTO_COINGECKO_MAP[ticker] || ticker.toLowerCase();
    try {
      const cgRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=idr&include_24hr_change=true`,
        {
          headers: { 'User-Agent': 'ArtosKu/1.0' },
          next: { revalidate: 60 },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (cgRes.ok) {
        const cgData = await cgRes.json();
        if (cgData[cgId]?.idr) {
          return NextResponse.json({
            success: true,
            ticker,
            price: cgData[cgId].idr,
            currency: 'IDR',
            change24h: cgData[cgId].idr_24h_change || 0,
            source: 'coingecko',
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch {
      // Ignore
    }
  }

  // 2. INDONESIAN STOCKS (IDX) PRICE FETCH (Yahoo Finance .JK)
  try {
    const symbol = ticker.endsWith('.JK') ? ticker : `${ticker}.JK`;
    const yfRes = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(6000),
      }
    );

    if (yfRes.ok) {
      const yfData = await yfRes.json();
      const meta = yfData?.chart?.result?.[0]?.meta;
      const marketPrice = meta?.regularMarketPrice;

      if (typeof marketPrice === 'number' && marketPrice > 0) {
        const prevClose = meta?.chartPreviousClose || marketPrice;
        const changePercent = prevClose > 0 ? ((marketPrice - prevClose) / prevClose) * 100 : 0;

        return NextResponse.json({
          success: true,
          ticker,
          price: marketPrice,
          currency: 'IDR',
          change24h: changePercent,
          source: 'yahoo_finance',
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch {
    // Continue to benchmark fallback
  }

  // 3. BENCHMARK FALLBACK (If external service is closed/rate-limited)
  if (IDX_BENCHMARK[ticker]) {
    return NextResponse.json({
      success: true,
      ticker,
      price: IDX_BENCHMARK[ticker],
      currency: 'IDR',
      change24h: 0,
      source: 'benchmark',
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    success: false,
    ticker,
    price: 0,
    currency: 'IDR',
    error: 'Market price not available for this ticker',
  });
}
