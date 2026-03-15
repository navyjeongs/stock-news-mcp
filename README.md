# stock-news-mcp

[![npm version](https://img.shields.io/npm/v/stock-news-mcp.svg)](https://www.npmjs.com/package/stock-news-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

주식 뉴스와 종목 정보를 조회하는 MCP (Model Context Protocol) 서버입니다.

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

## 데이터 소스

- **국내 뉴스:** 네이버 검색 API (API 키 설정 시) 또는 Google News RSS
- **해외 뉴스:** Google News RSS
- **종목 정보:** Yahoo Finance (via yahoo-finance2)

## 라이선스

MIT
