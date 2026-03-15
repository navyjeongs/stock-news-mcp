import { z } from "zod";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
import {
  sma,
  rsi,
  macd,
  bollingerBands,
  rsiSignal,
  macdSignal,
  smaSignal,
  bollingerSignal,
  type Signal,
} from "../utils/indicators.js";

export const stockAnalysisSchema = z.object({
  symbol: z.string().describe("티커 심볼 (예: AAPL, 005930.KS)"),
});

export async function getStockAnalysis(
  args: z.infer<typeof stockAnalysisSchema>
) {
  try {
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setDate(oneYearAgo.getDate() - 300); // ~200 거래일 확보

    const [chartResult, summary] = await Promise.all([
      yahooFinance.chart(args.symbol, {
        period1: oneYearAgo,
        period2: now,
        interval: "1d",
      }),
      yahooFinance.quoteSummary(args.symbol, {
        modules: [
          "financialData",
          "defaultKeyStatistics",
          "recommendationTrend",
          "earningsTrend",
        ],
      }),
    ]);

    const quotes = chartResult.quotes.filter(
      (q: any) => q.close != null && q.close > 0
    );
    const closes: number[] = quotes.map((q: any) => q.close as number);
    const currentPrice = closes[closes.length - 1];

    // === Technical Indicators ===
    const sma50 = sma(closes, 50);
    const sma200 = sma(closes, 200);
    const rsiValue = rsi(closes, 14);
    const macdResult = macd(closes);
    const bbResult = bollingerBands(closes, 20, 2);

    const technical: Record<string, unknown> = {
      currentPrice,
      sma50: sma50
        ? { value: Math.round(sma50 * 100) / 100, signal: smaSignal(currentPrice, sma50) }
        : null,
      sma200: sma200
        ? { value: Math.round(sma200 * 100) / 100, signal: smaSignal(currentPrice, sma200) }
        : null,
      goldenDeadCross:
        sma50 && sma200
          ? {
              status: sma50 > sma200 ? "골든크로스" : "데드크로스",
              signal: (sma50 > sma200 ? "bullish" : "bearish") as Signal,
            }
          : null,
      rsi: rsiValue
        ? {
            value: Math.round(rsiValue * 100) / 100,
            signal: rsiSignal(rsiValue),
          }
        : null,
      macd: macdResult
        ? { ...macdResult, signal: macdSignal(macdResult.histogram) }
        : null,
      bollingerBands: bbResult
        ? { ...bbResult, signal: bollingerSignal(bbResult.percentB) }
        : null,
    };

    // === Fundamental Indicators ===
    const fin = summary.financialData;
    const stats = summary.defaultKeyStatistics;

    const fundamental: Record<string, unknown> = {
      per: buildMetric(stats?.trailingEps && currentPrice ? currentPrice / stats.trailingEps : stats?.forwardPE, perSignal),
      pbr: buildMetric(stats?.priceToBook, pbrSignal),
      peg: buildMetric(stats?.pegRatio, pegSignal),
      roe: buildMetric(
        fin?.returnOnEquity != null ? fin.returnOnEquity * 100 : null,
        roeSignal,
        "%"
      ),
      debtToEquity: buildMetric(
        fin?.debtToEquity,
        debtSignal
      ),
      epsGrowth: buildMetric(
        getEpsGrowth(summary.earningsTrend),
        epsGrowthSignal,
        "%"
      ),
      dividendYield: buildMetric(
        stats?.dividendYield != null ? Number(stats.dividendYield) * 100 : null,
        dividendSignal,
        "%"
      ),
      profitMargin: buildMetric(
        fin?.profitMargins != null ? fin.profitMargins * 100 : null,
        null,
        "%"
      ),
    };

    // === Analyst Opinions ===
    const trend = summary.recommendationTrend?.trend?.[0];
    const targetHigh = fin?.targetHighPrice;
    const targetLow = fin?.targetLowPrice;
    const targetMean = fin?.targetMeanPrice;

    const analyst: Record<string, unknown> = {
      recommendations: trend
        ? {
            strongBuy: trend.strongBuy,
            buy: trend.buy,
            hold: trend.hold,
            sell: trend.sell,
            strongSell: trend.strongSell,
          }
        : null,
      targetPrice: targetMean
        ? {
            mean: targetMean,
            high: targetHigh,
            low: targetLow,
            upside: Math.round(((targetMean - currentPrice) / currentPrice) * 10000) / 100,
            signal: targetPriceSignal(currentPrice, targetMean),
          }
        : null,
    };

    // === Summary ===
    const allSignals = collectSignals({ technical, fundamental, analyst });
    const bullishCount = allSignals.filter((s) => s === "bullish").length;
    const bearishCount = allSignals.filter((s) => s === "bearish").length;
    const neutralCount = allSignals.filter((s) => s === "neutral").length;

    const summaryResult = {
      totalIndicators: allSignals.length,
      bullish: bullishCount,
      bearish: bearishCount,
      neutral: neutralCount,
      overall: bullishCount > bearishCount + 2
        ? "bullish"
        : bearishCount > bullishCount + 2
          ? "bearish"
          : "neutral",
    };

    const result = {
      symbol: args.symbol,
      technical,
      fundamental,
      analyst,
      summary: summaryResult,
    };

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) },
      ],
    };
  } catch {
    return {
      content: [
        {
          type: "text" as const,
          text: `분석 데이터를 가져올 수 없습니다: ${args.symbol}`,
        },
      ],
      isError: true,
    };
  }
}

// === Signal helpers ===

function buildMetric(
  value: number | null | undefined,
  signalFn: ((v: number) => Signal) | null,
  unit?: string
): { value: number | null; signal: Signal | null; unit?: string } {
  if (value == null || isNaN(value)) return { value: null, signal: null };
  const rounded = Math.round(value * 100) / 100;
  return {
    value: rounded,
    signal: signalFn ? signalFn(rounded) : null,
    ...(unit && { unit }),
  };
}

function perSignal(v: number): Signal {
  if (v < 0) return "bearish";
  if (v < 15) return "bullish";
  if (v > 30) return "bearish";
  return "neutral";
}

function pbrSignal(v: number): Signal {
  if (v < 1) return "bullish";
  if (v > 3) return "bearish";
  return "neutral";
}

function pegSignal(v: number): Signal {
  if (v < 0) return "bearish";
  if (v < 1) return "bullish";
  if (v > 2) return "bearish";
  return "neutral";
}

function roeSignal(v: number): Signal {
  if (v > 15) return "bullish";
  if (v < 5) return "bearish";
  return "neutral";
}

function debtSignal(v: number): Signal {
  if (v < 50) return "bullish";
  if (v > 150) return "bearish";
  return "neutral";
}

function epsGrowthSignal(v: number): Signal {
  if (v > 10) return "bullish";
  if (v < 0) return "bearish";
  return "neutral";
}

function dividendSignal(v: number): Signal {
  if (v > 3) return "bullish";
  if (v > 0) return "neutral";
  return "neutral";
}

function targetPriceSignal(current: number, target: number): Signal {
  const upside = (target - current) / current;
  if (upside > 0.15) return "bullish";
  if (upside < -0.1) return "bearish";
  return "neutral";
}

function getEpsGrowth(
  earningsTrend: { trend?: Array<{ growth?: number | null }> } | undefined
): number | null {
  const growth = earningsTrend?.trend?.[0]?.growth;
  if (growth == null) return null;
  return growth * 100;
}

function collectSignals(sections: Record<string, unknown>): Signal[] {
  const signals: Signal[] = [];
  function walk(obj: unknown) {
    if (obj && typeof obj === "object") {
      const record = obj as Record<string, unknown>;
      if (typeof record.signal === "string" && ["bullish", "bearish", "neutral"].includes(record.signal)) {
        signals.push(record.signal as Signal);
      }
      for (const val of Object.values(record)) {
        walk(val);
      }
    }
  }
  walk(sections);
  return signals;
}
