import { z } from "zod";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const stockScreenerSchema = z.object({
  market: z
    .enum(["kr", "us"])
    .optional()
    .describe("시장 선택 (kr: 한국, us: 미국, 기본값: kr)"),
  maxPER: z.number().optional().describe("PER 상한 (예: 15)"),
  minROE: z.number().optional().describe("ROE 하한 % (예: 10)"),
  minDividendYield: z
    .number()
    .optional()
    .describe("배당수익률 하한 % (예: 3)"),
  maxDebtToEquity: z
    .number()
    .optional()
    .describe("부채비율 상한 % (예: 100)"),
  minMarketCap: z
    .number()
    .optional()
    .describe("최소 시가총액 (원 또는 달러)"),
});

interface ScreenResult {
  symbol: string;
  name: string | null;
  price: number | null;
  changePercent: number | null;
  marketCap: number | null;
  per: number | null;
  roe: number | null;
  dividendYield: number | null;
  debtToEquity: number | null;
}

// 스크리닝 대상 유니버스
const KR_UNIVERSE = [
  "005930.KS", "000660.KS", "373220.KS", "207940.KS", "005380.KS",
  "006400.KS", "035420.KS", "035720.KS", "000270.KS", "068270.KS",
  "105560.KS", "055550.KS", "086790.KS", "003550.KS", "012330.KS",
  "051910.KS", "096770.KS", "028260.KS", "034730.KS", "066570.KS",
  "003670.KS", "032830.KS", "015760.KS", "017670.KS", "030200.KS",
  "036570.KS", "009150.KS", "033780.KS", "011200.KS", "010950.KS",
  "024110.KS", "316140.KS", "047050.KS", "018260.KS", "090430.KS",
  "329180.KS", "010140.KS", "042660.KS", "012450.KS", "009540.KS",
];

const US_UNIVERSE = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "BRK-B",
  "UNH", "JNJ", "JPM", "V", "PG", "MA", "HD", "CVX", "MRK", "ABBV",
  "PEP", "KO", "PFE", "TMO", "COST", "AVGO", "WMT", "MCD", "CSCO",
  "ACN", "ABT", "DHR", "NEE", "LIN", "TXN", "PM", "UPS", "AMD",
  "LOW", "INTC", "GS", "CAT",
];

async function fetchScreenData(symbol: string): Promise<ScreenResult | null> {
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
      roe: fin?.returnOnEquity != null
        ? Math.round(fin.returnOnEquity * 10000) / 100
        : null,
      dividendYield: q.dividendYield != null
        ? Math.round(q.dividendYield * 100) / 100
        : null,
      debtToEquity: fin?.debtToEquity != null
        ? Math.round(fin.debtToEquity * 100) / 100
        : null,
    };
  } catch {
    return null;
  }
}

function matchesFilters(
  stock: ScreenResult,
  args: z.infer<typeof stockScreenerSchema>
): boolean {
  if (args.maxPER != null) {
    if (stock.per == null || stock.per <= 0 || stock.per > args.maxPER) return false;
  }
  if (args.minROE != null) {
    if (stock.roe == null || stock.roe < args.minROE) return false;
  }
  if (args.minDividendYield != null) {
    if (stock.dividendYield == null || stock.dividendYield < args.minDividendYield)
      return false;
  }
  if (args.maxDebtToEquity != null) {
    if (stock.debtToEquity == null || stock.debtToEquity > args.maxDebtToEquity)
      return false;
  }
  if (args.minMarketCap != null) {
    if (stock.marketCap == null || stock.marketCap < args.minMarketCap) return false;
  }
  return true;
}

export async function screenStocks(
  args: z.infer<typeof stockScreenerSchema>
) {
  const market = args.market ?? "kr";
  const universe = market === "kr" ? KR_UNIVERSE : US_UNIVERSE;

  try {
    // 5개씩 배치로 조회 (API 부하 방지)
    const allResults: ScreenResult[] = [];
    const batchSize = 5;
    for (let i = 0; i < universe.length; i += batchSize) {
      const batch = universe.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(fetchScreenData));
      for (const r of results) {
        if (r != null) allResults.push(r);
      }
    }

    const filtered = allResults.filter((s) => matchesFilters(s, args));

    const hasFilters =
      args.maxPER != null ||
      args.minROE != null ||
      args.minDividendYield != null ||
      args.maxDebtToEquity != null ||
      args.minMarketCap != null;

    const appliedFilters: Record<string, number> = {};
    if (args.maxPER != null) appliedFilters["PER ≤"] = args.maxPER;
    if (args.minROE != null) appliedFilters["ROE ≥"] = args.minROE;
    if (args.minDividendYield != null)
      appliedFilters["배당수익률 ≥"] = args.minDividendYield;
    if (args.maxDebtToEquity != null)
      appliedFilters["부채비율 ≤"] = args.maxDebtToEquity;
    if (args.minMarketCap != null)
      appliedFilters["시가총액 ≥"] = args.minMarketCap;

    const result = {
      market: market === "kr" ? "한국" : "미국",
      filters: hasFilters ? appliedFilters : "필터 없음 (전체 조회)",
      totalScanned: allResults.length,
      matchedCount: filtered.length,
      stocks: filtered,
    };

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  } catch {
    return {
      content: [
        { type: "text" as const, text: "주식 스크리닝에 실패했습니다." },
      ],
      isError: true,
    };
  }
}
