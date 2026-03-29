import { z } from "zod";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const compareStocksSchema = z.object({
  symbols: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("비교할 티커 심볼 배열 (2~5개, 예: ['AAPL', 'MSFT'] 또는 ['005930.KS', '000660.KS'])"),
});

interface StockComparison {
  symbol: string;
  name: string | null;
  price: number | null;
  changePercent: number | null;
  marketCap: number | null;
  per: number | null;
  pbr: number | null;
  roe: number | null;
  dividendYield: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  volume: number | null;
  debtToEquity: number | null;
  profitMargin: number | null;
}

async function fetchStockData(symbol: string): Promise<StockComparison> {
  const fallback: StockComparison = {
    symbol,
    name: null,
    price: null,
    changePercent: null,
    marketCap: null,
    per: null,
    pbr: null,
    roe: null,
    dividendYield: null,
    fiftyTwoWeekHigh: null,
    fiftyTwoWeekLow: null,
    volume: null,
    debtToEquity: null,
    profitMargin: null,
  };

  try {
    const [quote, summary] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.quoteSummary(symbol, {
        modules: ["financialData", "defaultKeyStatistics"],
      }),
    ]);

    const q = quote as Record<string, any>;
    const fin = summary.financialData;
    const stats = summary.defaultKeyStatistics;

    return {
      symbol,
      name: q.shortName ?? q.longName ?? null,
      price: q.regularMarketPrice ?? null,
      changePercent: q.regularMarketChangePercent != null
        ? Math.round(q.regularMarketChangePercent * 100) / 100
        : null,
      marketCap: q.marketCap ?? null,
      per: q.trailingPE != null ? Math.round(q.trailingPE * 100) / 100 : null,
      pbr: stats?.priceToBook != null ? Math.round(stats.priceToBook * 100) / 100 : null,
      roe: fin?.returnOnEquity != null ? Math.round(fin.returnOnEquity * 10000) / 100 : null,
      dividendYield: q.dividendYield != null
        ? Math.round(q.dividendYield * 100) / 100
        : null,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? null,
      volume: q.regularMarketVolume ?? null,
      debtToEquity: fin?.debtToEquity != null ? Math.round(fin.debtToEquity * 100) / 100 : null,
      profitMargin: fin?.profitMargins != null ? Math.round(fin.profitMargins * 10000) / 100 : null,
    };
  } catch {
    return fallback;
  }
}

export async function compareStocks(args: z.infer<typeof compareStocksSchema>) {
  try {
    const results = await Promise.all(args.symbols.map(fetchStockData));

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(results, null, 2) },
      ],
    };
  } catch {
    return {
      content: [
        { type: "text" as const, text: `종목 비교에 실패했습니다: ${args.symbols.join(", ")}` },
      ],
      isError: true,
    };
  }
}
