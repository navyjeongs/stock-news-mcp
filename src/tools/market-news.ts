import { z } from "zod";
import { fetchNews } from "../utils/rss.js";

export const marketNewsSchema = z.object({
  count: z
    .number()
    .optional()
    .describe("반환할 뉴스 수 (기본값: 5, 최대: 20)"),
});

const TOPICS = [
  "글로벌 경제 금리 유가 환율",
  "global economy war geopolitics oil",
];

export async function getMarketNews(args: z.infer<typeof marketNewsSchema>) {
  const count = args.count ?? 5;

  try {
    const [koNews, enNews] = await Promise.all([
      fetchNews(TOPICS[0], { hl: "ko", gl: "KR", ceid: "KR:ko" }, count),
      fetchNews(TOPICS[1], { hl: "en", gl: "US", ceid: "US:en" }, count),
    ]);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ korean: koNews, global: enNews }, null, 2),
        },
      ],
    };
  } catch {
    return {
      content: [{ type: "text" as const, text: "Failed to fetch market news" }],
      isError: true,
    };
  }
}
