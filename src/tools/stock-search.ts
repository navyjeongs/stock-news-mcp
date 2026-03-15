import { z } from "zod";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const stockSearchSchema = z.object({
  query: z
    .string()
    .describe("종목명 또는 티커 심볼 (예: 삼성전자, Samsung, AAPL)"),
});

const KOREAN_TO_ENGLISH: Record<string, string> = {
  삼성전자: "Samsung Electronics",
  SK하이닉스: "SK Hynix",
  LG에너지솔루션: "LG Energy Solution",
  삼성바이오로직스: "Samsung Biologics",
  현대차: "Hyundai Motor",
  현대자동차: "Hyundai Motor",
  기아: "Kia Corporation",
  셀트리온: "Celltrion",
  KB금융: "KB Financial",
  신한지주: "Shinhan Financial",
  포스코홀딩스: "POSCO Holdings",
  네이버: "Naver Corporation",
  카카오: "Kakao Corp",
  LG화학: "LG Chem",
  삼성SDI: "Samsung SDI",
  현대모비스: "Hyundai Mobis",
  삼성물산: "Samsung CT",
  한국전력: "KEPCO",
  SK이노베이션: "SK Innovation",
  SK텔레콤: "SK Telecom",
  하나금융지주: "Hana Financial",
  우리금융지주: "Woori Financial",
  LG전자: "LG Electronics",
  삼성생명: "Samsung Life",
  카카오뱅크: "Kakao Bank",
  크래프톤: "Krafton",
  두산에너빌리티: "Doosan Enerbility",
  한화에어로스페이스: "Hanwha Aerospace",
  한화오션: "Hanwha Ocean",
  HD현대중공업: "HD Hyundai Heavy Industries",
  에코프로비엠: "Ecopro BM",
  에코프로: "Ecopro",
  포스코퓨처엠: "POSCO Future M",
  SK: "SK Inc",
  LG: "LG Corp",
  한미반도체: "Hanmi Semiconductor",
  리노공업: "LEENO Industrial",
  두산밥캣: "Doosan Bobcat",
};

export async function searchStock(args: z.infer<typeof stockSearchSchema>) {
  try {
    const englishQuery = KOREAN_TO_ENGLISH[args.query] || args.query;

    const result = await yahooFinance.search(englishQuery);
    const equities = result.quotes
      .filter((q: any) => q.quoteType === "EQUITY" && q.isYahooFinance)
      .slice(0, 5)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.longname || q.shortname,
        exchange: q.exchDisp || q.exchange,
        sector: q.sectorDisp || undefined,
        industry: q.industryDisp || undefined,
      }));

    if (equities.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `종목을 찾을 수 없습니다: ${args.query}`,
          },
        ],
      };
    }

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(equities, null, 2) },
      ],
    };
  } catch {
    return {
      content: [
        {
          type: "text" as const,
          text: `종목 검색에 실패했습니다: ${args.query}`,
        },
      ],
      isError: true,
    };
  }
}
