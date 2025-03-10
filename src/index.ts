#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const miniClientUrl = 'http://localhost:5039';
const networkCommandUrl = `${miniClientUrl}/api/NetworkCommand`;

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
    const url = `${networkCommandUrl}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    } catch (error) {
      console.error('Error fetching commands:', error);
      return { content: [{ type: "text", text: "获取命令失败" }] };
    }
    }
  );

  server.tool(
    "send_command",
    "发送命令到 miniClient，需要提供命令名称和命令数据",
    { commandName: z.string().describe('要发送的命令名称'), commandData: z.record(z.any()).describe('命令的数据，一个JSON对象') },
    async (params: { commandName: string; commandData: Record<string, any> }) => {
      const { commandName, commandData } = params;
      const url = `${networkCommandUrl}/forwardBotRequest`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            BotId: 1,
            CommandType: commandName,
            CommandJson: JSON.stringify(commandData)
          }),
        });

        if (!response.ok) {
          var errMsg = await response.text();
          return {
            content: [{
              type: "text",
              text: `请求失败: HTTP ${response.status} ${response.statusText}`,
              error: errMsg
            }]
          };
        }
        
        const responseData = await response.json();
        const formattedResponse = typeof responseData === 'object' ? JSON.stringify(responseData) : responseData;
        return { 
          content: [{ 
            type: "text", 
            text: formattedResponse
          }] 
        };
      } catch (error) {
        return { 
          content: [{ 
            type: "text", 
            text: `发送命令 ${commandName} 失败`,
            error: `error: ${error}` ,
            stack: error instanceof Error ? error.stack : undefined
          }] 
        };
      }
    },
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
