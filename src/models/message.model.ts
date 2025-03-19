import mongoose, { Schema } from 'mongoose';
import { BaseModel, BaseModelInput } from './base.model';

export interface IMessage extends BaseModel {
  botId: number;
  commandType: string;
  commandData: string;
  response?: string;
  status: 'pending' | 'success' | 'failed';
}

export interface IMessageInput extends BaseModelInput {
  botId: number;
  commandType: string;
  commandData: string;
  response?: string;
  status?: 'pending' | 'success' | 'failed';
}

const messageSchema = new Schema<IMessage>(
  {
    botId: { type: Number, required: true },
    commandType: { type: String, required: true },
    commandData: { type: String, required: true },
    response: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const Message = mongoose.model<IMessage>('Message', messageSchema); 