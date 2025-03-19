import mongoose, { Schema } from 'mongoose';
import { BaseModel, BaseModelInput } from './base.model';

export interface IItem extends BaseModel {
  itemId: number;
  name: string;
  category: number;
  description?: string;
}

export interface IItemInput extends BaseModelInput {
  itemId: number;
  name: string;
  category: number;
  description?: string;
}

const itemSchema = new Schema<IItem>(
  {
    itemId: { 
      type: Number, 
      required: true, 
      unique: true,
      index: true 
    },
    name: { 
      type: String, 
      required: true,
      index: true  // 为名称添加索引以提升搜索性能
    },
    category: { 
      type: Number, 
      required: true,
      index: true 
    },
    description: { 
      type: String 
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// 创建文本索引用于模糊搜索
itemSchema.index({ name: 'text' });

export const Item = mongoose.model<IItem>('Item', itemSchema);


/**
 * 物品分类枚举
 * 定义系统中所有物品的分类类型
 */
export enum ItemCategory {
  Invalid = 0,                    //无效
  Currency = 1,                   //货币
  Item = 2,                       //物品
  Recipe = 3,                     //配方
  Blueprint = 4,                  //图纸
  FeatureOpen = 5,                //功能解锁
  Property = 6,                   //玩家属性更改
  Theme = 7,                      //主题 | 爱好
  ExpType = 8,                    //经验类型
  ThemeExp = 10,                  //主题经验值，因带主题ID 若在经验类型中扩展需要添加参数列 | 爱好经验
  HobbyAbilityExp = 11,           //爱好能力经验值
  Buff = 12,                      //buff
  BlindBox = 15,                  //盲盒
  ToolSkin = 16,                  //手持工具皮肤
  ExpressionAction = 17,          //表情和动作
  PostCard = 18,                  //明信片卡片
  Tool = 19,                      //手持工具
  ChatDialogueSkin = 20,          //聊天气泡皮肤
  Avatar = 21,                    //妆容
  BuildItem = 22,                 //建造解锁
  PayPoint = 23,                  //虚拟道具：充值点数(主要用于触发任务)
  DateAnchor = 24,                //虚拟道具：时间锚点(主要用于条件表达式配置：DateAnchor[1]<1)
  ResetStoreSlot = 25,            //重置StoreId_SlotId的商店，slot=0表示刷新StoreId
  BuildItemModule = 26,           //建造模组
  HobbyExamineTicket = 27,        //爱好考核券
  PlayerTitle = 28,               //玩家称号
  GameEventTimer = 29,            //虚拟道具：事件定时器
  PayProduct = 30,                //充值道具
  SeniorHobbyExamineTicket = 31,  //高级爱好考核券
  Gift = 32,                      //自定义礼包类型，包装动态的物品
  Sticker = 33,                   //贴纸


  GmPictorialPointTypeValue = 34,  // 仅gm使用补偿功能发放！！游戏逻辑不应该使用！！添加图鉴点数类子类总value 34_图鉴子类_score

  ActivityExclusiveItems = 35, // 活动专属道具(非背包物品，是一个活动内的计数)
} 