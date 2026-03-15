import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
});

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

interface GoogleNewsLocale {
  hl: string;
  gl: string;
  ceid: string;
}

export async function fetchNews(
  query: string,
  locale: GoogleNewsLocale,
  count: number
): Promise<NewsItem[]> {
  const cappedCount = Math.min(Math.max(count, 1), 20);

  // 3일 먼저 시도, 결과 부족하면 7일로 확장
  const encodedQuery3d = encodeURIComponent(`${query} when:3d`);
  const url3d = `https://news.google.com/rss/search?q=${encodedQuery3d}&hl=${locale.hl}&gl=${locale.gl}&ceid=${locale.ceid}`;

  let feed = await parser.parseURL(url3d);

  if (feed.items.length < cappedCount) {
    const encodedQuery7d = encodeURIComponent(`${query} when:7d`);
    const url7d = `https://news.google.com/rss/search?q=${encodedQuery7d}&hl=${locale.hl}&gl=${locale.gl}&ceid=${locale.ceid}`;
    feed = await parser.parseURL(url7d);
  }

  return feed.items.slice(0, cappedCount).map((item) => ({
    title: item.title ?? "",
    link: item.link ?? "",
    pubDate: item.pubDate ?? "",
    source: item.creator ?? item.source ?? "",
  }));
}
