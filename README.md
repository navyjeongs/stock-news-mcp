# stock-news-mcp

[![npm version](https://img.shields.io/npm/v/stock-news-mcp.svg)](https://www.npmjs.com/package/stock-news-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

주식 뉴스, 종목 분석, 포트폴리오 관리를 위한 MCP (Model Context Protocol) 서버입니다.

## 기능

| 도구 | 설명 |
|------|------|
| `get_korean_stock_news` | 국내 주식 뉴스 조회 |
| `get_us_stock_news` | 미국 주식 뉴스 조회 |
| `get_stock_news` | 특정 종목 관련 뉴스 검색 |
| `get_stock_info` | 특정 종목 정보 조회 (현재가, 등락률, 시가총액 등) |
| `get_market_news` | 글로벌 시장 이슈 뉴스 (전쟁, 금리, 유가 등) |
| `get_stock_analysis` | 종목 종합 분석 (기술적 지표 + 펀더멘털 + 애널리스트 의견) |
| `search_stock` | 종목명으로 티커 심볼 검색 (한국어/영어 지원) |
| `get_market_summary` | 증시 자동 요약 (시간대별 한국/미국 증시) |
| `compare_stocks` | 여러 종목 나란히 비교 (PER, PBR, ROE 등) |
| `get_sector_performance` | 업종/섹터별 대표 종목 성과 분석 |
| `analyze_portfolio` | 보유 종목 포트폴리오 종합 분석 |
| `get_exchange_rate` | 주요 환율 정보 조회 (USD/KRW, EUR/USD 등) |
| `screen_stocks` | 조건 기반 종목 스크리닝 (PER, ROE, 배당률 등) |

모든 뉴스 도구는 `sentiment` 파라미터를 지원합니다:
- `positive` — 호재 뉴스만
- `negative` — 악재 뉴스만

## 설치 & 실행

```bash
npm install -g stock-news-mcp
# 또는
npx stock-news-mcp
```

## MCP 클라이언트 설정

### Claude Desktop

`claude_desktop_config.json`에 추가:

```json
{
  "mcpServers": {
    "stock-news-mcp": {
      "command": "npx",
      "args": ["-y", "stock-news-mcp"]
    }
  }
}
```

> 설정 파일 위치:
> - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
> - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### Claude Code

```bash
claude mcp add stock-news-mcp -- npx -y stock-news-mcp
```

### Cursor

Cursor Settings → MCP → `Add new global MCP server`에서 아래 설정 추가:

```json
{
  "mcpServers": {
    "stock-news-mcp": {
      "command": "npx",
      "args": ["-y", "stock-news-mcp"]
    }
  }
}
```

### Windsurf

Windsurf Settings → Cascade → MCP → `Add Server` → `Add custom server`에서 아래 설정 추가:

```json
{
  "mcpServers": {
    "stock-news-mcp": {
      "command": "npx",
      "args": ["-y", "stock-news-mcp"]
    }
  }
}
```

### 네이버 뉴스 API 사용 (선택)

국내 뉴스를 네이버 검색 API로 가져오려면 [네이버 개발자센터](https://developers.naver.com/)에서 API 키를 발급받고 환경변수를 설정하세요. 설정하지 않으면 Google News RSS를 사용합니다.

```json
{
  "mcpServers": {
    "stock-news-mcp": {
      "command": "npx",
      "args": ["-y", "stock-news-mcp"],
      "env": {
        "NAVER_CLIENT_ID": "발급받은_ID",
        "NAVER_CLIENT_SECRET": "발급받은_SECRET"
      }
    }
  }
}
```

## 도구 상세

### get_korean_stock_news

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `query` | string (optional) | "한국 주식 시장" | 검색 키워드 |
| `count` | number (optional) | 5 | 반환할 뉴스 수 (최대 20) |
| `sentiment` | "positive" \| "negative" (optional) | - | 호재/악재 필터 |

### get_us_stock_news

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `query` | string (optional) | "US stock market" | 검색 키워드 |
| `count` | number (optional) | 5 | 반환할 뉴스 수 (최대 20) |
| `sentiment` | "positive" \| "negative" (optional) | - | 호재/악재 필터 |

### get_stock_news

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `symbol` | string (required) | 티커 심볼 (예: `AAPL`, `005930.KS`) |
| `count` | number (optional) | 반환할 뉴스 수 (기본 5, 최대 20) |
| `sentiment` | "positive" \| "negative" (optional) | 호재/악재 필터 |

### get_stock_info

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `symbol` | string (required) | 티커 심볼 (예: `AAPL`, `005930.KS`) |
| `fields` | string[] (optional) | 추가 요청 필드 |

**기본 반환 필드:** name, price, change, volume, marketCap, fiftyTwoWeekHigh, fiftyTwoWeekLow, trailingPE, dividendYield

**추가 요청 가능 필드 예시:** `epsTrailingTwelveMonths`, `beta`, `sector`, `industry` 등

### get_market_news

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `count` | number (optional) | 5 | 반환할 뉴스 수 (최대 20) |

글로벌 경제, 지정학 이슈 뉴스를 한국어 + 영어로 가져옵니다.

### get_stock_analysis

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `symbol` | string (required) | 티커 심볼 (예: `AAPL`, `005930.KS`) |

종목의 매수/매도 판단에 필요한 데이터를 종합적으로 반환합니다:

**기술적 지표:**
- SMA (50일/200일 이동평균), 골든/데드크로스
- RSI (14일) — 과매수/과매도 판단
- MACD — 추세 모멘텀
- 볼린저 밴드 — 변동성 분석

**펀더멘털 지표:**
- PER, PBR, PEG, ROE, 부채비율, EPS 성장률, 배당수익률, 이익률

**애널리스트 의견:**
- Strong Buy/Buy/Hold/Sell/Strong Sell 분포
- 목표가 (평균/최고/최저) 및 현재가 대비 괴리율

각 지표에 `bullish`/`bearish`/`neutral` 신호가 태깅되며, `summary`에 전체 종합 신호를 제공합니다.

### search_stock

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `query` | string (required) | 종목명 또는 티커 심볼 (예: `삼성전자`, `Samsung`, `AAPL`) |

한국어 종목명(삼성전자, SK하이닉스, 네이버 등)을 입력하면 Yahoo Finance 티커 심볼을 반환합니다. 심볼을 모를 때 다른 도구 사용 전에 먼저 검색하세요.

### get_market_summary

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `count` | number (optional) | 7 | 뉴스 수 (최대 20) |

현재 시간 기준으로 최근 12시간 내 주요 증시를 자동 판단하여 요약합니다. 오전이면 밤사이 미국장을, 오후~새벽이면 한국장을 요약합니다. 주요 지수, 시장 뉴스, 글로벌 매크로 뉴스를 한번에 반환합니다.

### compare_stocks

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `symbols` | string[] (required) | 비교할 티커 심볼 배열 (2~5개, 예: `["AAPL", "MSFT"]`) |

주가, PER, PBR, ROE, 시가총액, 배당수익률, 부채비율, 이익률 등 핵심 지표를 한눈에 비교합니다.

### get_sector_performance

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `market` | "kr" \| "us" (optional) | "kr" | 시장 선택 |

**한국 섹터:** 반도체, 2차전지, 바이오, 인터넷플랫폼, 자동차, 금융, 방산, 조선

**미국 섹터:** 빅테크, 반도체, 전기차, 금융, 헬스케어, 에너지, 소비재

각 섹터별 대표 종목의 현재가, 등락률, 시가총액과 섹터 평균 등락률을 반환합니다.

### analyze_portfolio

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `holdings` | array (required) | 보유 종목 배열 (1~20개) |

`holdings` 배열 각 항목:

| 필드 | 타입 | 설명 |
|------|------|------|
| `symbol` | string | 티커 심볼 |
| `quantity` | number | 보유 수량 |
| `avgPrice` | number | 평균 매수 단가 |

종목별 수익률, 포트폴리오 총 수익률, 섹터별 비중, 집중도 경고를 제공합니다.

### get_exchange_rate

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `pairs` | string[] (optional) | 환율 쌍 배열 (예: `["USDKRW", "EURKRW"]`) |

미지정 시 주요 환율 전체를 반환합니다:
USD/KRW, EUR/KRW, JPY/KRW, CNY/KRW, GBP/KRW, EUR/USD, USD/JPY, 달러인덱스(DXY)

### screen_stocks

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `market` | "kr" \| "us" (optional) | 시장 선택 (기본값: "kr") |
| `maxPER` | number (optional) | PER 상한 (예: 15) |
| `minROE` | number (optional) | ROE 하한 % (예: 10) |
| `minDividendYield` | number (optional) | 배당수익률 하한 % (예: 3) |
| `maxDebtToEquity` | number (optional) | 부채비율 상한 % (예: 100) |
| `minMarketCap` | number (optional) | 최소 시가총액 (원 또는 달러) |

한국 40개, 미국 40개 대형주 유니버스에서 조건에 맞는 종목을 필터링합니다.

## 데이터 소스

- **국내 뉴스:** 네이버 검색 API (API 키 설정 시) 또는 Google News RSS
- **해외 뉴스:** Google News RSS
- **종목 정보/분석:** Yahoo Finance (via yahoo-finance2)

## 라이선스

MIT
