export type Signal = "bullish" | "bearish" | "neutral";

export function sma(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function ema(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];
  // 첫 EMA는 SMA로 시작
  let prev = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(prev);
  for (let i = period; i < prices.length; i++) {
    prev = prices[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

export function rsi(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function macd(prices: number[]): {
  macd: number;
  signal: number;
  histogram: number;
} | null {
  if (prices.length < 35) return null; // 26 + 9 minimum
  const ema12 = ema(prices, 12);
  const ema26 = ema(prices, 26);

  // ema12 시작 인덱스는 12, ema26 시작 인덱스는 26
  // 둘 다 맞추려면 ema12에서 14개 스킵 (26-12)
  const offset = 26 - 12;
  const macdLine: number[] = [];
  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + offset] - ema26[i]);
  }

  const signalLine = ema(macdLine, 9);
  if (signalLine.length === 0) return null;

  const lastMacd = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];

  return {
    macd: round(lastMacd),
    signal: round(lastSignal),
    histogram: round(lastMacd - lastSignal),
  };
}

export function bollingerBands(
  prices: number[],
  period: number = 20,
  multiplier: number = 2
): { upper: number; middle: number; lower: number; percentB: number } | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  const variance =
    slice.reduce((sum, p) => sum + (p - middle) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = middle + multiplier * stdDev;
  const lower = middle - multiplier * stdDev;
  const currentPrice = prices[prices.length - 1];
  const percentB = upper === lower ? 0.5 : (currentPrice - lower) / (upper - lower);

  return {
    upper: round(upper),
    middle: round(middle),
    lower: round(lower),
    percentB: round(percentB),
  };
}

export function rsiSignal(value: number): Signal {
  if (value < 30) return "bullish";
  if (value > 70) return "bearish";
  return "neutral";
}

export function macdSignal(histogram: number): Signal {
  if (histogram > 0) return "bullish";
  if (histogram < 0) return "bearish";
  return "neutral";
}

export function smaSignal(price: number, smaValue: number): Signal {
  const diff = (price - smaValue) / smaValue;
  if (diff > 0.02) return "bullish";
  if (diff < -0.02) return "bearish";
  return "neutral";
}

export function bollingerSignal(percentB: number): Signal {
  if (percentB < 0.2) return "bullish";
  if (percentB > 0.8) return "bearish";
  return "neutral";
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
