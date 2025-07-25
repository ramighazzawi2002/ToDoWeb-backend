import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ToDoListDocument = HydratedDocument<ToDoList>;

@Schema()
export class ToDoList {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'ToDoItem', default: [] })
  toDoItems: Types.ObjectId[];

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ToDoListSchema = SchemaFactory.createForClass(ToDoList);
ToDoListSchema.set('timestamps', true);
