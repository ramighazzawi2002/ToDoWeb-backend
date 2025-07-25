import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ToDoItem } from '../schema/todo-item.schema';
import { ToDoList } from '../schema/todo-list.schema';
import { Model, Types } from 'mongoose';
import { CreateTodoItemDto } from './dto/create-todo-item.dto';
import { UpdateToDoItemDto } from './dto/update-todo-item.dto';

@Injectable()
export class TodoitemsService {
  constructor(
    @InjectModel(ToDoItem.name) private todoItemModel: Model<ToDoItem>,
    @InjectModel(ToDoList.name) private todoListModel: Model<ToDoList>,
  ) {}

  async addToItem(createTodoItemDto: CreateTodoItemDto) {
    const todoItem = new this.todoItemModel({
      ...createTodoItemDto,
      toDoListId: new Types.ObjectId(createTodoItemDto.toDoListId),
    });
    const savedItem = await todoItem.save();
    await this.todoListModel.findByIdAndUpdate(createTodoItemDto.toDoListId, {
      $push: { toDoItems: savedItem._id },
    });
    return savedItem;
  }

  async updateToDoItem(id: string, updateTodoItemDto: UpdateToDoItemDto) {
    const updatedItem = await this.todoItemModel.findByIdAndUpdate(
      id,
      updateTodoItemDto,
      { new: true },
    );
    if (!updatedItem) {
      throw new NotFoundException('ToDo Item not found');
    }
    return updatedItem;
  }

  async deleteToDoItem(id: string) {
    const deletedItem = await this.todoItemModel.findByIdAndUpdate(id, {
      isDeleted: true,
    });
    if (!deletedItem) {
      throw new NotFoundException('ToDo Item not found');
    }
    return 'ToDo Item deleted successfully';
  }
}
