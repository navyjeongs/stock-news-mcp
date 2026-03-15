import { z } from "zod";
import { fetchNews } from "../utils/rss.js";

export const usNewsSchema = z.object({
  query: z
    .string()
    .optional()
    .describe("Search keyword (default: US stock market)"),
  count: z
    .number()
    .optional()
    .describe("Number of news items to return (default: 5, max: 20)"),
});

export async function getUsStockNews(args: z.infer<typeof usNewsSchema>) {
  const query = args.query ?? "US stock market";
  const count = args.count ?? 5;

  try {
    const news = await fetchNews(query, { hl: "en", gl: "US", ceid: "US:en" }, count);
    return { content: [{ type: "text" as const, text: JSON.stringify(news, null, 2) }] };
  } catch {
    return { content: [{ type: "text" as const, text: "Failed to fetch news" }], isError: true };
  }
}
