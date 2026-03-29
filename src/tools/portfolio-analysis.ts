import { z } from "zod";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const holdingSchema = z.object({
  symbol: z.string().describe("티커 심볼"),
  quantity: z.number().describe("보유 수량"),
  avgPrice: z.number().describe("평균 매수 단가"),
});

export const portfolioAnalysisSchema = z.object({
  holdings: z
    .array(holdingSchema)
    .min(1)
    .max(20)
    .describe("보유 종목 배열 (심볼, 수량, 평균매수가)"),
});

interface HoldingResult {
  symbol: string;
  name: string | null;
  quantity: number;
  avgPrice: number;
  currentPrice: number | null;
  investedAmount: number;
  currentValue: number | null;
  profitLoss: number | null;
  profitLossPercent: number | null;
  weight: number | null;
  sector: string | null;
}

export async function analyzePortfolio(
  args: z.infer<typeof portfolioAnalysisSchema>
) {
  try {
    const holdingResults: HoldingResult[] = [];

    // 모든 종목 데이터 병렬 조회
    const quotes = await Promise.all(
      args.holdings.map(async (h) => {
        try {
          const quote = await yahooFinance.quote(h.symbol);
          return { symbol: h.symbol, quote: quote as Record<string, any> };
        } catch {
          return { symbol: h.symbol, quote: null };
        }
      })
    );

    const quoteMap = new Map(quotes.map((q) => [q.symbol, q.quote]));

    // 각 종목별 분석
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let hasAllPrices = true;

    for (const h of args.holdings) {
      const q = quoteMap.get(h.symbol);
      const currentPrice = q?.regularMarketPrice ?? null;
      const investedAmount = h.quantity * h.avgPrice;
      const currentValue = currentPrice != null ? h.quantity * currentPrice : null;
      const profitLoss = currentValue != null ? currentValue - investedAmount : null;
      const profitLossPercent =
        profitLoss != null
          ? Math.round((profitLoss / investedAmount) * 10000) / 100
          : null;

      totalInvested += investedAmount;
      if (currentValue != null) {
        totalCurrentValue += currentValue;
      } else {
        hasAllPrices = false;
      }

      holdingResults.push({
        symbol: h.symbol,
        name: q?.shortName ?? q?.longName ?? null,
        quantity: h.quantity,
        avgPrice: h.avgPrice,
        currentPrice,
        investedAmount,
        currentValue,
        profitLoss: profitLoss != null ? Math.round(profitLoss) : null,
        profitLossPercent,
        weight: null, // 아래에서 계산
        sector: q?.sector ?? null,
      });
    }

    // 비중 계산
    if (hasAllPrices && totalCurrentValue > 0) {
      for (const h of holdingResults) {
        if (h.currentValue != null) {
          h.weight = Math.round((h.currentValue / totalCurrentValue) * 10000) / 100;
        }
      }
    }

    // 섹터 분산 분석
    const sectorMap = new Map<string, number>();
    for (const h of holdingResults) {
      const sector = h.sector ?? "기타";
      const current = sectorMap.get(sector) ?? 0;
      sectorMap.set(sector, current + (h.currentValue ?? 0));
    }

    const sectorAllocation: Record<string, number> = {};
    if (totalCurrentValue > 0) {
      for (const [sector, value] of sectorMap) {
        sectorAllocation[sector] =
          Math.round((value / totalCurrentValue) * 10000) / 100;
      }
    }

    // 집중도 경고
    const warnings: string[] = [];
    for (const h of holdingResults) {
      if (h.weight != null && h.weight > 40) {
        warnings.push(
          `${h.symbol}(${h.name}) 비중이 ${h.weight}%로 높습니다. 분산 투자를 고려하세요.`
        );
      }
    }
    for (const [sector, pct] of Object.entries(sectorAllocation)) {
      if (pct > 60) {
        warnings.push(
          `${sector} 섹터 비중이 ${pct}%로 높습니다. 업종 분산을 고려하세요.`
        );
      }
    }
    if (holdingResults.length < 3) {
      warnings.push("보유 종목이 3개 미만입니다. 분산 투자를 고려하세요.");
    }

    const totalProfitLoss = hasAllPrices ? totalCurrentValue - totalInvested : null;
    const totalProfitLossPercent =
      totalProfitLoss != null && totalInvested > 0
        ? Math.round((totalProfitLoss / totalInvested) * 10000) / 100
        : null;

    const result = {
      summary: {
        totalInvested: Math.round(totalInvested),
        totalCurrentValue: hasAllPrices ? Math.round(totalCurrentValue) : null,
        totalProfitLoss: totalProfitLoss != null ? Math.round(totalProfitLoss) : null,
        totalProfitLossPercent,
        holdingsCount: holdingResults.length,
      },
      holdings: holdingResults,
      sectorAllocation,
      warnings: warnings.length > 0 ? warnings : null,
    };

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  } catch {
    return {
      content: [
        { type: "text" as const, text: "포트폴리오 분석에 실패했습니다." },
      ],
      isError: true,
    };
  }
}
