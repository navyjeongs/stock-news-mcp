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

## 데이터 소스

- **국내 뉴스:** 네이버 검색 API (API 키 설정 시) 또는 Google News RSS
- **해외 뉴스:** Google News RSS
- **종목 정보:** Yahoo Finance (via yahoo-finance2)

## 라이선스

MIT
