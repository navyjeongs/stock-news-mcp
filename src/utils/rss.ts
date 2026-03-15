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
  // when:1d = 최근 1일 뉴스만 필터링
  const encodedQuery = encodeURIComponent(`${query} when:1d`);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=${locale.hl}&gl=${locale.gl}&ceid=${locale.ceid}`;

  const cappedCount = Math.min(Math.max(count, 1), 20);

  const feed = await parser.parseURL(url);

  return feed.items.slice(0, cappedCount).map((item) => ({
    title: item.title ?? "",
    link: item.link ?? "",
    pubDate: item.pubDate ?? "",
    source: item.creator ?? item.source ?? "",
  }));
}
