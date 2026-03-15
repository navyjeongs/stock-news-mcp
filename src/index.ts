#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { koreanNewsSchema, getKoreanStockNews } from "./tools/korean-news.js";
import { usNewsSchema, getUsStockNews } from "./tools/us-news.js";
import { stockInfoSchema, getStockInfo } from "./tools/stock-info.js";

const server = new McpServer({
  name: "stock-mcp",
  version: "1.0.0",
});

server.tool(
  "get_korean_stock_news",
  "국내 주식 관련 뉴스를 가져옵니다",
  koreanNewsSchema.shape,
  getKoreanStockNews
);

server.tool(
  "get_us_stock_news",
  "Get US stock market news",
  usNewsSchema.shape,
  getUsStockNews
);

server.tool(
  "get_stock_info",
  "특정 종목의 주식 정보를 조회합니다 (현재가, 등락률, 시가총액 등)",
  stockInfoSchema.shape,
  getStockInfo
);

const transport = new StdioServerTransport();
await server.connect(transport);
