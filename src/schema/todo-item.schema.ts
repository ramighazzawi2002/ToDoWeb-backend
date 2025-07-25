import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ToDoItemDocument = HydratedDocument<ToDoItem>;

@Schema()
export class ToDoItem {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Types.ObjectId, ref: 'ToDoList', required: true })
  toDoListId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  dueDate: Date;
}

export const ToDoItemSchema = SchemaFactory.createForClass(ToDoItem);
