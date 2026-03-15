import { z } from "zod";
import { fetchNews } from "../utils/rss.js";

export const koreanNewsSchema = z.object({
  query: z
    .string()
    .optional()
    .describe("검색 키워드 (기본값: 한국 주식 시장)"),
  count: z
    .number()
    .optional()
    .describe("반환할 뉴스 수 (기본값: 5, 최대: 20)"),
});

export async function getKoreanStockNews(
  args: z.infer<typeof koreanNewsSchema>
) {
  const query = args.query ?? "한국 주식 시장";
  const count = args.count ?? 5;

  try {
    const news = await fetchNews(query, { hl: "ko", gl: "KR", ceid: "KR:ko" }, count);
    return { content: [{ type: "text" as const, text: JSON.stringify(news, null, 2) }] };
  } catch {
    return { content: [{ type: "text" as const, text: "Failed to fetch news" }], isError: true };
  }
}
