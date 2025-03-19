import { ConnectOptions } from 'mongoose';

export const dbConfig = {
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017/mcp_db',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as ConnectOptions
}; 