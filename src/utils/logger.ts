import winston from 'winston';
import path from 'path';
import fs from 'fs';
import 'winston-daily-rotate-file';

// 确保日志目录存在
const LOG_DIR = path.join('D:', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 创建格式
const { combine, timestamp, printf, colorize, json } = winston.format;

// 自定义日志格式
const logFormat = printf((info) => {
  const { timestamp, level, message, ...rest } = info;
  let logMessage = `[${timestamp}] [${level}] ${message}`;
  
  // 如果有额外的对象信息，将其格式化为 JSON 添加到日志中
  if (Object.keys(rest).length > 0) {
    logMessage += ` ${JSON.stringify(rest, null, 0)}`;
  }
  
  return logMessage;
});

// 获取环境变量中的日志级别，默认为 'info'
const logLevel = process.env.LOG_LEVEL || 'info';

// 由于缺少类型定义，使用 as any 断言
const DailyRotateFile = require('winston-daily-rotate-file');

// 创建 Winston logger 实例
const logger = winston.createLogger({
  level: logLevel,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // 每日轮换的日志文件
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'xdtMiniClient-mcp-server-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    // 错误日志单独存储
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error'
    })
  ],
});

// 导出日志实例
export default logger; 