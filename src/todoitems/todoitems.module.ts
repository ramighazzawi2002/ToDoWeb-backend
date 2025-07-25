import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ToDoItem, ToDoItemSchema } from '../schema/todo-item.schema';
import { ToDoList, ToDoListSchema } from '../schema/todo-list.schema';
import { TodoitemsController } from './todoitems.controller';
import { TodoitemsService } from './todoitems.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ToDoItem.name, schema: ToDoItemSchema },
      { name: ToDoList.name, schema: ToDoListSchema },
    ]),
  ],
  controllers: [TodoitemsController],
  providers: [TodoitemsService],
  exports: [MongooseModule],
})
export class TodoitemsModule {}
