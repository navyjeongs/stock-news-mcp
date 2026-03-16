import { z } from "zod";
import YahooFinance from "yahoo-finance2";
import { fetchNews } from "../utils/rss.js";
import { isNaverAvailable, fetchNaverNews } from "../utils/naver.js";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const marketSummarySchema = z.object({
  count: z
    .number()
    .optional()
    .describe("뉴스 수 (기본값: 7, 최대: 20)"),
});

interface IndexQuote {
  name: string;
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
}

const KR_INDICES = [
  { symbol: "^KS11", name: "KOSPI" },
  { symbol: "^KQ11", name: "KOSDAQ" },
  { symbol: "USDKRW=X", name: "USD/KRW" },
];

const US_INDICES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^DJI", name: "DOW" },
  { symbol: "^VIX", name: "VIX" },
];

function getKSTHour(): number {
  const now = new Date();
  // UTC + 9 = KST
  const kstOffset = 9 * 60;
  const kstMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + kstOffset;
  return Math.floor((kstMinutes % 1440) / 60);
}

function detectMarketFocus(): "us" | "kr" {
  const hour = getKSTHour();
  // 5AM ~ 12PM KST → 밤사이 미국장 마감 → 미국 증시 요약
  // 1PM ~ 4AM KST → 한국장 마감 → 한국 증시 요약
  if (hour >= 5 && hour < 13) {
    return "us";
  }
  return "kr";
}

async function fetchIndexQuotes(
  indices: { symbol: string; name: string }[]
): Promise<IndexQuote[]> {
  const results: IndexQuote[] = [];
  for (const idx of indices) {
    try {
      const quote = await yahooFinance.quote(idx.symbol);
      results.push({
        name: idx.name,
        symbol: idx.symbol,
        price: (quote as any).regularMarketPrice ?? null,
        change: (quote as any).regularMarketChange ?? null,
        changePercent: (quote as any).regularMarketChangePercent ?? null,
      });
    } catch {
      results.push({
        name: idx.name,
        symbol: idx.symbol,
        price: null,
        change: null,
        changePercent: null,
      });
    }
  }
  return results;
}

async function fetchMarketNews(focus: "us" | "kr", count: number) {
  if (focus === "kr") {
    const query = "한국 주식 시장 코스피 코스닥";
    const news = isNaverAvailable()
      ? await fetchNaverNews(query, count)
      : await fetchNews(query, { hl: "ko", gl: "KR", ceid: "KR:ko" }, count);
    return news;
  } else {
    const news = await fetchNews(
      "US stock market Wall Street",
      { hl: "en", gl: "US", ceid: "US:en" },
      count
    );
    return news;
  }
}

async function fetchMacroNews(count: number) {
  const [koMacro, enMacro] = await Promise.all([
    fetchNews(
      "글로벌 경제 금리 유가 환율",
      { hl: "ko", gl: "KR", ceid: "KR:ko" },
      Math.ceil(count / 2)
    ),
    fetchNews(
      "global economy interest rate oil geopolitics",
      { hl: "en", gl: "US", ceid: "US:en" },
      Math.ceil(count / 2)
    ),
  ]);
  return { korean: koMacro, global: enMacro };
}

export async function getMarketSummary(
  args: z.infer<typeof marketSummarySchema>
) {
  const count = args.count ?? 7;
  const focus = detectMarketFocus();
  const kstHour = getKSTHour();

  try {
    const indices = focus === "kr" ? KR_INDICES : US_INDICES;

    const [indexQuotes, marketNews, macroNews] = await Promise.all([
      fetchIndexQuotes(indices),
      fetchMarketNews(focus, count),
      fetchMacroNews(Math.min(count, 5)),
    ]);

    const focusLabel =
      focus === "kr" ? "한국 증시 (국내장)" : "미국 증시 (미국장)";

    const result = {
      focus: focusLabel,
      detectedAt: `KST ${kstHour}시 기준`,
      reason:
        focus === "us"
          ? "오전 시간대 → 밤사이 미국장 마감 내용 요약"
          : "오후~새벽 시간대 → 한국장 내용 요약",
      indices: indexQuotes,
      news: marketNews,
      macro: macroNews,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch {
    return {
      content: [
        { type: "text" as const, text: "Failed to fetch market summary" },
      ],
      isError: true,
    };
  }
}
