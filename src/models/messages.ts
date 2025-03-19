/**
 * 消息结构定义文件
 */

/**
 * 命令请求消息
 */
export interface CommandRequest {
  BotId: number;
  CommandType: string;
  CommandJson: string;
}

/**
 * 命令响应消息
 */
export interface CommandResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * 命令数据基础接口
 */
export interface CommandData {
  [key: string]: any;
}