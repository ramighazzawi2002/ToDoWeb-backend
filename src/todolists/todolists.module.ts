import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ToDoList, ToDoListSchema } from '../schema/todo-list.schema';
import { TodolistsController } from './todolists.controller';
import { TodolistsService } from './todolists.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ToDoList.name, schema: ToDoListSchema },
    ]),
  ],
  controllers: [TodolistsController],
  providers: [TodolistsService],
  exports: [MongooseModule],
})
export class TodolistsModule {}
