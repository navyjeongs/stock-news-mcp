import { z } from "zod";
import yahooFinance from "yahoo-finance2";
import { fetchNews } from "../utils/rss.js";

export const stockNewsSchema = z.object({
  symbol: z.string().describe("티커 심볼 (예: AAPL, 005930.KS)"),
  count: z
    .number()
    .optional()
    .describe("반환할 뉴스 수 (기본값: 5, 최대: 20)"),
});

export async function getStockNews(args: z.infer<typeof stockNewsSchema>) {
  const count = args.count ?? 5;

  try {
    const quote = await yahooFinance.quote(args.symbol);
    const q = quote as Record<string, unknown>;
    const name = (q.shortName as string) ?? (q.longName as string) ?? args.symbol;

    // 한국 종목이면 한국어 뉴스, 아니면 영어 뉴스
    const isKorean = args.symbol.endsWith(".KS") || args.symbol.endsWith(".KQ");
    const locale = isKorean
      ? { hl: "ko", gl: "KR", ceid: "KR:ko" }
      : { hl: "en", gl: "US", ceid: "US:en" };

    const news = await fetchNews(name, locale, count);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ symbol: args.symbol, name, news }, null, 2),
        },
      ],
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
