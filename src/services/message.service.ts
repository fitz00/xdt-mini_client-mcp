import { Message, IMessage, IMessageInput } from '../models/message.model';
import logger from '../utils/logger';

export class MessageService {
  /**
   * 创建新消息
   */
  async create(data: IMessageInput): Promise<IMessage> {
    try {
      const message = new Message(data);
      return await message.save();
    } catch (error) {
      logger.error('Error creating message:', error);
      throw error;
    }
  }

  /**
   * 根据ID查找消息
   */
  async findById(id: string): Promise<IMessage | null> {
    try {
      return await Message.findById(id);
    } catch (error) {
      logger.error('Error finding message:', error);
      throw error;
    }
  }

  /**
   * 查找所有消息
   */
  async findAll(filter: Partial<IMessageInput> = {}): Promise<IMessage[]> {
    try {
      return await Message.find(filter);
    } catch (error) {
      logger.error('Error finding messages:', error);
      throw error;
    }
  }

  /**
   * 更新消息
   */
  async update(id: string, data: Partial<IMessageInput>): Promise<IMessage | null> {
    try {
      return await Message.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      );
    } catch (error) {
      logger.error('Error updating message:', error);
      throw error;
    }
  }

  /**
   * 删除消息
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await Message.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  }
} 