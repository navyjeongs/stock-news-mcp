export type Sentiment = "positive" | "negative";

const KEYWORDS: Record<string, Record<Sentiment, string>> = {
  ko: {
    positive: "호재 상승 성장 실적개선 신고가",
    negative: "악재 하락 부진 실적악화 급락",
  },
  en: {
    positive: "bullish rally surge growth upgrade",
    negative: "bearish drop decline downgrade sell-off",
  },
};

export function applySentiment(
  query: string,
  sentiment: Sentiment | undefined,
  lang: "ko" | "en"
): string {
  if (!sentiment) return query;
  return `${query} ${KEYWORDS[lang][sentiment]}`;
}
