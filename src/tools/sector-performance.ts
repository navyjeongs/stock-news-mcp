import { z } from "zod";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const sectorPerformanceSchema = z.object({
  market: z
    .enum(["kr", "us"])
    .optional()
    .describe("시장 선택 (kr: 한국, us: 미국, 기본값: kr)"),
});

interface SectorStock {
  symbol: string;
  name: string | null;
  price: number | null;
  changePercent: number | null;
  marketCap: number | null;
}

interface SectorResult {
  sector: string;
  stocks: SectorStock[];
  avgChangePercent: number | null;
}

const KR_SECTORS: Record<string, string[]> = {
  반도체: ["005930.KS", "000660.KS", "042700.KQ"],
  "2차전지": ["373220.KS", "006400.KS", "247540.KS"],
  바이오: ["207940.KS", "068270.KS", "326030.KS"],
  인터넷플랫폼: ["035420.KS", "035720.KS", "263750.KS"],
  자동차: ["005380.KS", "000270.KS", "012330.KS"],
  금융: ["105560.KS", "055550.KS", "086790.KS"],
  방산: ["012450.KS", "042660.KS", "047810.KS"],
  조선: ["329180.KS", "010140.KS", "009540.KS"],
};

const US_SECTORS: Record<string, string[]> = {
  빅테크: ["AAPL", "MSFT", "GOOGL", "AMZN", "META"],
  반도체: ["NVDA", "AMD", "INTC", "AVGO", "TSM"],
  전기차: ["TSLA", "RIVN", "LCID"],
  금융: ["JPM", "BAC", "GS", "MS"],
  헬스케어: ["UNH", "JNJ", "PFE", "ABBV"],
  에너지: ["XOM", "CVX", "COP"],
  소비재: ["WMT", "COST", "HD"],
};

async function fetchSectorStocks(symbols: string[]): Promise<SectorStock[]> {
  const results: SectorStock[] = [];
  for (const symbol of symbols) {
    try {
      const quote = await yahooFinance.quote(symbol);
      const q = quote as Record<string, any>;
      results.push({
        symbol,
        name: q.shortName ?? q.longName ?? null,
        price: q.regularMarketPrice ?? null,
        changePercent: q.regularMarketChangePercent != null
          ? Math.round(q.regularMarketChangePercent * 100) / 100
          : null,
        marketCap: q.marketCap ?? null,
      });
    } catch {
      results.push({
        symbol,
        name: null,
        price: null,
        changePercent: null,
        marketCap: null,
      });
    }
  }
  return results;
}

export async function getSectorPerformance(
  args: z.infer<typeof sectorPerformanceSchema>
) {
  const market = args.market ?? "kr";
  const sectors = market === "kr" ? KR_SECTORS : US_SECTORS;

  try {
    const sectorEntries = Object.entries(sectors);
    const allResults = await Promise.all(
      sectorEntries.map(([, symbols]) => fetchSectorStocks(symbols))
    );

    const sectorResults: SectorResult[] = sectorEntries.map(
      ([sectorName], idx) => {
        const stocks = allResults[idx];
        const validChanges = stocks
          .map((s) => s.changePercent)
          .filter((c): c is number => c != null);
        const avgChange =
          validChanges.length > 0
            ? Math.round(
                (validChanges.reduce((a, b) => a + b, 0) / validChanges.length) *
                  100
              ) / 100
            : null;

        return {
          sector: sectorName,
          stocks,
          avgChangePercent: avgChange,
        };
      }
    );

    // 평균 등락률 기준 정렬 (높은 순)
    sectorResults.sort((a, b) => {
      if (a.avgChangePercent == null) return 1;
      if (b.avgChangePercent == null) return -1;
      return b.avgChangePercent - a.avgChangePercent;
    });

    const result = {
      market: market === "kr" ? "한국" : "미국",
      sectors: sectorResults,
    };

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  } catch {
    return {
      content: [
        { type: "text" as const, text: "섹터 성과 데이터를 가져올 수 없습니다." },
      ],
      isError: true,
    };
  }
}
