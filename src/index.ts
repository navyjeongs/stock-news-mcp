#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { koreanNewsSchema, getKoreanStockNews } from "./tools/korean-news.js";
import { usNewsSchema, getUsStockNews } from "./tools/us-news.js";
import { stockInfoSchema, getStockInfo } from "./tools/stock-info.js";
import { stockNewsSchema, getStockNews } from "./tools/stock-news.js";
import { marketNewsSchema, getMarketNews } from "./tools/market-news.js";
import {
  stockAnalysisSchema,
  getStockAnalysis,
} from "./tools/stock-analysis.js";
import {
  stockSearchSchema,
  searchStock,
} from "./tools/stock-search.js";
import {
  marketSummarySchema,
  getMarketSummary,
} from "./tools/market-summary.js";
import {
  compareStocksSchema,
  compareStocks,
} from "./tools/compare-stocks.js";
import {
  sectorPerformanceSchema,
  getSectorPerformance,
} from "./tools/sector-performance.js";
import {
  portfolioAnalysisSchema,
  analyzePortfolio,
} from "./tools/portfolio-analysis.js";
import {
  exchangeRateSchema,
  getExchangeRate,
} from "./tools/exchange-rate.js";
import {
  stockScreenerSchema,
  screenStocks,
} from "./tools/stock-screener.js";

const server = new McpServer({
  name: "stock-mcp",
  version: "1.0.0",
});

server.tool(
  "get_korean_stock_news",
  "국내 주식 시장 뉴스를 가져옵니다. 한국 주식 시장 동향, 코스피/코스닥 관련 질문에 사용하세요.",
  koreanNewsSchema.shape,
  getKoreanStockNews
);

server.tool(
  "get_us_stock_news",
  "미국 주식 시장 뉴스를 가져옵니다. 나스닥, S&P500, 미국 증시 관련 질문에 사용하세요.",
  usNewsSchema.shape,
  getUsStockNews
);

server.tool(
  "get_stock_info",
  "특정 종목의 현재 주가, 등락률, 시가총액 등 기본 정보를 조회합니다. 주가가 얼마인지, 오늘 올랐는지 등의 질문에 사용하세요.",
  stockInfoSchema.shape,
  getStockInfo
);

server.tool(
  "get_stock_news",
  "특정 종목에 대한 최신 뉴스를 검색합니다. 종목의 최근 이슈나 호재/악재를 파악할 때 사용하세요.",
  stockNewsSchema.shape,
  getStockNews
);

server.tool(
  "get_market_news",
  "글로벌 시장 이슈 뉴스를 가져옵니다 (전쟁, 금리, 유가, 환율, 지정학 등). 세계 경제 흐름이나 매크로 이슈를 파악할 때 사용하세요.",
  marketNewsSchema.shape,
  getMarketNews
);

server.tool(
  "get_stock_analysis",
  "종목의 매수/매도 판단을 위한 종합 분석 도구입니다. 기술적 지표(SMA, RSI, MACD, 볼린저밴드), 펀더멘털(PER, PBR, ROE, 부채비율 등), 애널리스트 의견(목표가, 추천)을 한번에 반환하며, 각 지표에 bullish/bearish/neutral 신호가 태깅되어 있고 종합 요약(summary)으로 매수/매도/관망 중 어느 쪽이 강한지 판단할 수 있습니다. 사용자가 '살까?', '팔까?', '매수해?', '매도해?', '구매', '판매', '지금 들어가도 될까?', '전망이 어때?', '이 주식 어때?' 등 투자 의견을 물으면 반드시 이 도구와 get_stock_news를 함께 사용하여 지표 분석 + 최신 뉴스를 종합한 의견을 제공하세요. 면책 조항은 포함하되, 분석 결과에 기반한 매수/매도/관망 의견은 반드시 제시하세요.",
  stockAnalysisSchema.shape,
  getStockAnalysis
);

server.tool(
  "search_stock",
  "종목명으로 티커 심볼을 검색합니다. 한국어 종목명(삼성전자, SK하이닉스, 네이버 등)이나 영어 종목명 모두 지원합니다. 사용자가 종목명만 말하고 심볼을 모를 때, 또는 다른 도구에서 심볼을 찾지 못했을 때 이 도구로 먼저 심볼을 확인하세요.",
  stockSearchSchema.shape,
  searchStock
);

server.tool(
  "get_market_summary",
  "증시 요약 도구입니다. 현재 시간 기준으로 최근 12시간 내 주요 증시를 자동 판단하여 요약합니다. 오전이면 밤사이 미국장을, 오후~새벽이면 한국장을 요약합니다. '증시 요약', '시장 요약', '오늘 장 어땠어?', '어제 장 어땠어?', '미장 어땠어?', '국장 어땠어?' 등의 질문에 사용하세요. 주요 지수(KOSPI/KOSDAQ 또는 S&P500/NASDAQ/DOW), 시장 뉴스, 글로벌 매크로 뉴스를 한번에 반환합니다.",
  marketSummarySchema.shape,
  getMarketSummary
);

server.tool(
  "get_exchange_rate",
  "주요 환율 정보를 조회합니다. USD/KRW, EUR/KRW, JPY/KRW, CNY/KRW, GBP/KRW, EUR/USD, USD/JPY, 달러인덱스(DXY) 등을 지원합니다. '환율 얼마야?', '달러 얼마야?', '원달러 환율', '엔화 환율' 등의 질문에 사용하세요. 특정 환율 쌍을 지정하거나, 미지정 시 주요 환율 전체를 반환합니다.",
  exchangeRateSchema.shape,
  getExchangeRate
);

server.tool(
  "analyze_portfolio",
  "보유 종목 포트폴리오를 종합 분석합니다. 종목별 수익률, 포트폴리오 총 수익률, 섹터별 비중, 집중도 경고를 제공합니다. '내 포트폴리오 분석해줘', '수익률 계산해줘' 등의 요청에 사용하세요. holdings 배열에 symbol(티커), quantity(수량), avgPrice(평균매수가)를 전달합니다.",
  portfolioAnalysisSchema.shape,
  analyzePortfolio
);

server.tool(
  "get_sector_performance",
  "업종/섹터별 대표 종목 성과를 한눈에 보여줍니다. 한국(반도체, 2차전지, 바이오, 자동차, 금융, 방산, 조선 등)과 미국(빅테크, 반도체, 전기차, 금융, 헬스케어, 에너지 등) 시장을 지원합니다. '업종별 성과', '섹터 분석', '어떤 업종이 강세야?', '오늘 섹터별 등락률' 등의 질문에 사용하세요.",
  sectorPerformanceSchema.shape,
  getSectorPerformance
);

server.tool(
  "compare_stocks",
  "여러 종목을 나란히 비교합니다. 주가, PER, PBR, ROE, 시가총액, 배당수익률, 부채비율, 이익률 등 핵심 지표를 한눈에 비교할 수 있습니다. '삼성전자 vs SK하이닉스', 'AAPL이랑 MSFT 비교해줘', '반도체주 비교' 등의 요청에 사용하세요.",
  compareStocksSchema.shape,
  compareStocks
);

server.tool(
  "screen_stocks",
  "조건 기반 종목 스크리너입니다. PER, ROE, 배당수익률, 부채비율, 시가총액 등의 조건으로 종목을 필터링합니다. '저PER 고ROE 종목 찾아줘', 'PER 15 이하 종목', '배당주 추천', '가치주 스크리닝', '성장주 찾기' 등의 요청에 사용하세요. 한국/미국 시장 모두 지원합니다.",
  stockScreenerSchema.shape,
  screenStocks
);

const transport = new StdioServerTransport();
await server.connect(transport);
