import { Item, IItem, IItemInput, ItemCategory } from '../models/item.model';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

export class ItemService {
  /**
   * 创建新物品
   */
  async create(data: IItemInput): Promise<IItem> {
    try {
      const item = new Item(data);
      return await item.save();
    } catch (error) {
      logger.error('Error creating item:', error);
      throw error;
    }
  }

  /**
   * 根据ID查找物品
   */
  async findById(id: string): Promise<IItem | null> {
    try {
      return await Item.findById(id);
    } catch (error) {
      logger.error('Error finding item:', error);
      throw error;
    }
  }

  /**
   * 根据物品ID查找物品
   */
  async findByItemId(itemId: number): Promise<IItem | null> {
    try {
      return await Item.findOne({ itemId });
    } catch (error) {
      logger.error('Error finding item by itemId:', error);
      throw error;
    }
  }

  /**
   * 模糊搜索物品
   * @param name 物品名称（支持模糊匹配）
   * @param category 可选的分类过滤
   * @param limit 返回结果数量限制
   */
  async searchByName(name: string, category?: number, limit: number = 10): Promise<IItem[]> {
    try {
      // 构建查询条件
      const query: any = {
        name: { $regex: name, $options: 'i' } // 使用正则表达式进行不区分大小写的模糊匹配
      };

      // 如果提供了分类，添加分类过滤
      if (category !== undefined) {
        query.category = category;
      }

      // 执行查询
      return await Item.find(query)
        .limit(limit)
        .sort({ name: 1 }); // 按名称排序
    } catch (error) {
      logger.error('Error searching items:', error);
      throw error;
    }
  }

  /**
   * 更新物品
   */
  async update(id: string, data: Partial<IItemInput>): Promise<IItem | null> {
    try {
      return await Item.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      );
    } catch (error) {
      logger.error('Error updating item:', error);
      throw error;
    }
  }

  /**
   * 删除物品
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await Item.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      logger.error('Error deleting item:', error);
      throw error;
    }
  }

  /**
   * 批量创建物品
   */
  async createMany(items: IItemInput[]): Promise<IItem[]> {
    try {
      const createdItems = await Promise.all(
        items.map(item => this.create(item))
      );
      return createdItems;
    } catch (error) {
      logger.error('Error creating multiple items:', error);
      throw error;
    }
  }

  /**
   * 删除指定分类的所有物品
   * @param category 物品分类
   * @returns 删除的物品数量
   */
  async deleteByCategory(category: number): Promise<number> {
    try {
      const result = await Item.deleteMany({ category });
      logger.info(`已删除 ${result.deletedCount} 个分类为 ${category} 的物品`);
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('删除分类物品时出错:', error);
      throw error;
    }
  }

  /**
   * 从 JSON 文件导入背包物品到数据库
   * @param filePath JSON文件路径
   * @returns 导入的物品数组和失败的物品ID数组
   */
  async importBagItemFromJson(filePath: string): Promise<{importedItems: IItem[], failedItemIds: number[]}> {
    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }
      
      // 读取并解析JSON文件
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const rawData = JSON.parse(fileContent);
      
      if (!Array.isArray(rawData)) {
        throw new Error('JSON文件内容必须是物品对象的数组');
      }
      
      // 先清空 ItemCategory.Item 分类的所有物品
      const deletedCount = await this.deleteByCategory(ItemCategory.Item);
      logger.info(`在导入新物品前已删除 ${deletedCount} 个背包物品`);
      
      // 收集失败的物品ID（没有name属性的物品）
      const failedItemIds: number[] = [];
      
      // 过滤和转换数据格式，忽略没有name的物品
      const itemsData: IItemInput[] = [];
      
      rawData.forEach(item => {
        if (item.id && item.name) {
          itemsData.push({
            itemId: item.id,
            name: item.name,
            category: ItemCategory.Item,
          });
        } else if (item.id) {
          // 记录缺少name属性的物品ID
          failedItemIds.push(item.id);
          logger.warn(`忽略物品ID ${item.id}: 缺少name属性`);
        } else {
          logger.warn(`忽略无效物品: 缺少id和name属性`);
        }
      });
      
      // 批量创建物品
      logger.info(`开始导入${itemsData.length}个物品，忽略了${failedItemIds.length}个没有name的物品...`);
      const importedItems = await this.createMany(itemsData);
      logger.info(`成功导入${importedItems.length}个物品`);
      
      return { importedItems, failedItemIds };
    } catch (error) {
      logger.error('导入物品时出错:', error);
      throw error;
    }
  }
} 