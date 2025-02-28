#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

/**
 * 创建一个基本的 MCP 服务器
 * 使用 stdio 进行通信
 */
async function main() {
  // 初始化 MCP 服务器
  const server = new McpServer({
    name: "XDT-Mini-Client",
    version: "0.1.0",
    description: "一个基本的 MCP 服务器示例"
  });

  // 注册一个简单的资源
  server.resource(
    "hello",
    new ResourceTemplate("hello://{name}", { list: undefined }),
    async (uri, { name }) => ({
      contents: [{
        uri: uri.href,
        text: `你好，${name}！这是一个基本的 MCP 资源示例。`
      }]
    })
  );

  // 注册一个简单的工具
  server.tool(
    "greet",
    { name: z.string(), language: z.enum(["zh", "en"]).optional() },
    async ({ name, language = "zh" }) => {
      const greeting = language === "zh" ? "你好" : "Hello";
      return {
        content: [{ 
          type: "text", 
          text: `${greeting}, ${name}!` 
        }]
      };
    }
  );

  // 拉取 miniClient 所有的 command
  server.tool(
    "get_all_commands",
    {},
    async () => {
      return {
        content: [{ type: "text", text: "所有命令" }]
      };
    }
  );

  // 注册一个简单的提示模板
  server.prompt(
    "introduction",
    { name: z.string(), topic: z.string() },
    ({ name, topic }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `我是 ${name}，我想了解关于 ${topic} 的信息。请提供一个简短的介绍。`
        }
      }]
    })
  );

  // 创建 stdio 传输层
  const transport = new StdioServerTransport();
  
  // 连接服务器到传输层
  console.error("MCP 服务器启动中...");
  await server.connect(transport);
  console.error("MCP 服务器已连接到 stdio 传输层");
}

// 启动服务器
main().catch(error => {
  console.error("MCP 服务器错误:", error);
  process.exit(1);
});
