import { NewsItem } from "./rss.js";

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

export function isNaverAvailable(): boolean {
  return !!(NAVER_CLIENT_ID && NAVER_CLIENT_SECRET);
}

export async function fetchNaverNews(
  query: string,
  count: number
): Promise<NewsItem[]> {
  const cappedCount = Math.min(Math.max(count, 1), 20);
  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${cappedCount}&sort=date`;

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": NAVER_CLIENT_ID!,
      "X-Naver-Client-Secret": NAVER_CLIENT_SECRET!,
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Naver API error: ${res.status}`);
  }

  const data = (await res.json()) as {
    items: { title: string; link: string; pubDate: string; originallink: string }[];
  };

  return data.items.map((item) => ({
    title: item.title.replace(/<[^>]*>/g, ""),
    link: item.originallink || item.link,
    pubDate: item.pubDate,
    source: new URL(item.originallink || item.link).hostname.replace("www.", ""),
  }));
}
