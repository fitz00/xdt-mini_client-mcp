import mongoose from 'mongoose';
import { dbConfig } from '../config/database';
import logger from './logger';

export class Database {
  private static instance: Database;

  private constructor() {
    this.connect();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async connect(): Promise<void> {
    try {
      await mongoose.connect(dbConfig.url, dbConfig.options);
      logger.info('Successfully connected to MongoDB.');

      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
        this.connect();
      });

    } catch (error) {
      logger.error('Error connecting to MongoDB:', error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      logger.info('Successfully disconnected from MongoDB.');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }
} 