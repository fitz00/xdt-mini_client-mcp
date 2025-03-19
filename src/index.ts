#!/usr/bin/env node

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import logger from './utils/logger';
import { Database } from './utils/database';
import { MessageService } from './services/message.service';
import { ItemService } from './services/item.service';

const miniClientUrl = 'http://localhost:5039';
const networkCommandUrl = `${miniClientUrl}/api/NetworkCommand`;

// 初始化消息服务
const messageService = new MessageService();
const itemService = new ItemService();

/**
 * 创建一个基本的 MCP 服务器
 * 使用 stdio 进行通信
 */
async function main() {
  // 初始化数据库连接
  Database.getInstance();

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

  // TODO(fitz) 登录 bot
  /*
  server.tool(
    "login_bot",
    "登录 bot,暂未实现",
    { account: z.string() },
    async ({ account }) => {
      const url = `${networkCommandUrl}/loginBot`;
      return {
        content: [{
          type: "text",
          text: `登录成功: ${account}`
        }]
      };
    }
  );
  */

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
      logger.error('Error fetching commands:', error);
      return { content: [{ type: "text", text: "获取命令失败" }] };
    }
    }
  );

  // 发送命令到 miniClient
  server.tool(
    "send_command",
    "发送命令到 miniClient，需要提供命令名称和命令数据",
    { 
      commandName: z.string().describe('要发送的命令名称'), 
      commandData: z.record(z.any()).describe('命令的数据，一个JSON对象') 
    },
    async (params) => {
      const { commandName, commandData } = params;
      const url = `${networkCommandUrl}/forwardBotRequest`;

      try {
        // 记录命令到数据库
        await messageService.create({
          botId: 1, // 默认 botId
          commandType: commandName,
          commandData: JSON.stringify(commandData),
          status: 'pending'
        });

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            BotId: 1,
            CommandType: commandName,
            CommandJson: JSON.stringify(commandData)
          })
        });

        if (!response.ok) {
          const errMsg = await response.text();
          logger.error(`Command ${commandName} failed with status ${response.status}`, { 
            error: errMsg, 
            commandName 
          });
          return { 
            content: [{ 
              type: "text", 
              text: `发送命令 ${commandName} 失败: ${errMsg}` 
            }] 
          };
        }
        
        const responseData = await response.json();
        logger.info(`Command ${commandName} completed successfully`, { 
          response: JSON.stringify(responseData) 
        });
        
        // 更新命令状态
        await messageService.update(responseData._id, {
          response: JSON.stringify(responseData),
          status: 'success'
        });

        const formattedResponse = typeof responseData === 'object' ? JSON.stringify(responseData) : responseData;
        return { 
          content: [{ 
            type: "text", 
            text: formattedResponse
          }] 
        };
      } catch (error) {
        logger.error(`Error executing command ${commandName}:`, error);
        return { 
          content: [{ 
            type: "text", 
            text: `发送命令 ${commandName} 失败: ${error}`
          }] 
        };
      }
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

  // 添加物品查询工具
  server.tool(
    "search_items",
    "搜索物品信息",
    {
      name: z.string().describe('物品名称（支持模糊匹配）'),
      category: z.number().optional().describe('物品分类（可选）'),
      limit: z.number().optional().describe('返回结果数量限制（可选）')
    },
    async ({ name, category, limit }) => {
      try {
        const items = await itemService.searchByName(name, category, limit);
        
        if (items.length === 0) {
          return {
            content: [{
              type: "text",
              text: `未找到匹配的物品：${name}`
            }]
          };
        }

        // 格式化查询结果
        const formattedItems = items.map(item => ({
          itemId: item.itemId,
          name: item.name,
          category: item.category,
          description: item.description || '暂无描述'
        }));

        return {
          content: [{
            type: "text",
            text: JSON.stringify(formattedItems, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Error searching items:', error);
        return {
          content: [{
            type: "text",
            text: `搜索物品时发生错误: ${error}`
          }]
        };
      }
    }
  );

  // 添加导入背包物品工具
  server.tool(
    "import_bag_items",
    "从JSON文件导入背包物品到数据库",
    {
      filePath: z.string().describe('JSON文件的路径')
    },
    async ({ filePath }) => {
      try {
        const { importedItems, failedItemIds } = await itemService.importBagItemFromJson(filePath);
        
        return {
          content: [{
            type: "text",
            text: `成功导入${importedItems.length}个物品，失败物品ID: ${failedItemIds.join(', ')}`
          }]
        };
      } catch (error) {
        logger.error('Error importing bag items:', error);
        return {
          content: [{
            type: "text",
            text: `导入背包物品时发生错误: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // 创建 stdio 传输层
  const transport = new StdioServerTransport();
  
  // 连接服务器到传输层
  logger.info("MCP 服务器启动中...");
  await server.connect(transport);
  logger.info("MCP 服务器已连接到 stdio 传输层");
}

// 启动服务器
main().catch(error => {
  logger.error("MCP 服务器错误:", error);
  process.exit(1);
});
