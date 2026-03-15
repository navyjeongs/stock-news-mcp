# stock-mcp

주식 뉴스와 종목 정보를 조회하는 MCP (Model Context Protocol) 서버입니다.

## 기능

| 도구 | 설명 |
|------|------|
| `get_korean_stock_news` | 국내 주식 뉴스 조회 (Google News RSS) |
| `get_us_stock_news` | 미국 주식 뉴스 조회 (Google News RSS) |
| `get_stock_info` | 특정 종목 정보 조회 (Yahoo Finance) |

## 설치 & 실행

```bash
npx stock-mcp
```

## Claude Desktop 설정

`claude_desktop_config.json`에 추가:

```json
{
  "mcpServers": {
    "stock-mcp": {
      "command": "npx",
      "args": ["stock-mcp"]
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

### get_us_stock_news

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `query` | string (optional) | "US stock market" | 검색 키워드 |
| `count` | number (optional) | 5 | 반환할 뉴스 수 (최대 20) |

### get_stock_info

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `symbol` | string (required) | 티커 심볼 (예: `AAPL`, `005930.KS`) |
| `fields` | string[] (optional) | 추가 요청 필드 |

**기본 반환 필드:** name, price, change, volume, marketCap, fiftyTwoWeekHigh, fiftyTwoWeekLow, trailingPE, dividendYield

**추가 요청 가능 필드 예시:** `epsTrailingTwelveMonths`, `beta`, `sector`, `industry` 등

## 데이터 소스

- **뉴스:** Google News RSS
- **종목 정보:** Yahoo Finance (via yahoo-finance2)

## 라이선스

MIT
