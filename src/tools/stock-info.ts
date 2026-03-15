import { z } from "zod";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const stockInfoSchema = z.object({
  symbol: z.string().describe("티커 심볼 (예: AAPL, 005930.KS)"),
  fields: z
    .array(z.string())
    .optional()
    .describe("기본 필드 외 추가 요청 필드 (yahoo-finance2 필드명)"),
});

const DEFAULT_FIELD_MAP: Record<string, string> = {
  name: "shortName",
  price: "regularMarketPrice",
  change: "regularMarketChangePercent",
  volume: "regularMarketVolume",
  marketCap: "marketCap",
  fiftyTwoWeekHigh: "fiftyTwoWeekHigh",
  fiftyTwoWeekLow: "fiftyTwoWeekLow",
  trailingPE: "trailingPE",
  dividendYield: "dividendYield",
};

export async function getStockInfo(args: z.infer<typeof stockInfoSchema>) {
  try {
    const quote = await yahooFinance.quote(args.symbol);
    const result: Record<string, unknown> = {};

    // 기본 필드 매핑
    for (const [displayName, yahooField] of Object.entries(DEFAULT_FIELD_MAP)) {
      result[displayName] =
        (quote as Record<string, unknown>)[yahooField] ?? null;
    }

    // 추가 요청 필드
    if (args.fields) {
      for (const field of args.fields) {
        result[field] =
          (quote as Record<string, unknown>)[field] ?? null;
      }
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  } catch {
    return {
      content: [
        { type: "text" as const, text: `Stock not found: ${args.symbol}` },
      ],
      isError: true,
    };
  }
}
