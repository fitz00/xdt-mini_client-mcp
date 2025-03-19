import { Document } from 'mongoose';

export interface BaseModel extends Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseModelInput {
  [key: string]: any;
} 