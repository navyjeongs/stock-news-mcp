import { z } from "zod";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const exchangeRateSchema = z.object({
  pairs: z
    .array(z.string())
    .optional()
    .describe(
      "환율 쌍 배열 (예: ['USDKRW', 'EURKRW']). 미지정 시 주요 환율 전체 조회"
    ),
});

interface ExchangeRateResult {
  pair: string;
  displayName: string;
  rate: number | null;
  change: number | null;
  changePercent: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

const DEFAULT_PAIRS: { symbol: string; displayName: string }[] = [
  { symbol: "USDKRW=X", displayName: "USD/KRW (달러/원)" },
  { symbol: "EURKRW=X", displayName: "EUR/KRW (유로/원)" },
  { symbol: "JPYKRW=X", displayName: "JPY/KRW (엔/원)" },
  { symbol: "CNYKRW=X", displayName: "CNY/KRW (위안/원)" },
  { symbol: "GBPKRW=X", displayName: "GBP/KRW (파운드/원)" },
  { symbol: "EURUSD=X", displayName: "EUR/USD (유로/달러)" },
  { symbol: "USDJPY=X", displayName: "USD/JPY (달러/엔)" },
  { symbol: "DX-Y.NYB", displayName: "달러 인덱스 (DXY)" },
];

function toYahooSymbol(pair: string): string {
  const cleaned = pair.replace("/", "").replace("-", "").toUpperCase();
  if (cleaned === "DXY" || cleaned === "달러인덱스") return "DX-Y.NYB";
  if (cleaned.endsWith("=X")) return cleaned;
  return `${cleaned}=X`;
}

async function fetchRate(
  symbol: string,
  displayName: string
): Promise<ExchangeRateResult> {
  try {
    const quote = await yahooFinance.quote(symbol);
    const q = quote as Record<string, any>;
    return {
      pair: symbol,
      displayName,
      rate: q.regularMarketPrice != null
        ? Math.round(q.regularMarketPrice * 100) / 100
        : null,
      change: q.regularMarketChange != null
        ? Math.round(q.regularMarketChange * 100) / 100
        : null,
      changePercent: q.regularMarketChangePercent != null
        ? Math.round(q.regularMarketChangePercent * 100) / 100
        : null,
      dayHigh: q.regularMarketDayHigh ?? null,
      dayLow: q.regularMarketDayLow ?? null,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? null,
    };
  } catch {
    return {
      pair: symbol,
      displayName,
      rate: null,
      change: null,
      changePercent: null,
      dayHigh: null,
      dayLow: null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
    };
  }
}

export async function getExchangeRate(
  args: z.infer<typeof exchangeRateSchema>
) {
  try {
    let targets: { symbol: string; displayName: string }[];

    if (args.pairs && args.pairs.length > 0) {
      targets = args.pairs.map((p) => ({
        symbol: toYahooSymbol(p),
        displayName: p,
      }));
    } else {
      targets = DEFAULT_PAIRS;
    }

    const results = await Promise.all(
      targets.map((t) => fetchRate(t.symbol, t.displayName))
    );

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(results, null, 2) },
      ],
    };
  } catch {
    return {
      content: [
        { type: "text" as const, text: "환율 정보를 가져올 수 없습니다." },
      ],
      isError: true,
    };
  }
}
