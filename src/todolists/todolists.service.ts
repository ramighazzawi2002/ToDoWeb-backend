import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ToDoList } from '../schema/todo-list.schema';
import { CreateToDoListDto } from './dto/create-todo-list.dto';
import { UpdateToDoListDto } from './dto/update-todo-list.dto';

@Injectable()
export class TodolistsService {
  constructor(
    @InjectModel(ToDoList.name) private todoListModel: Model<ToDoList>,
  ) {}

  getAllToDoLists(userId: string) {
    return this.todoListModel.find({ userId }).populate('toDoItems');
  }

  async createToDoList(createToDoListDto: CreateToDoListDto, userId: string) {
    const todoList = new this.todoListModel({ ...createToDoListDto, userId });
    return todoList.save();
  }

  async updateToDoList(id: string, updateToDoListDto: UpdateToDoListDto) {
    const todoList = await this.todoListModel.findByIdAndUpdate(
      id,
      updateToDoListDto,
      { new: true },
    );
    if (!todoList) {
      throw new NotFoundException(`ToDo List with ID ${id} not found`);
    }
    return todoList;
  }

  async deleteToDoList(id: string) {
    const todoList = await this.todoListModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
    if (!todoList) {
      throw new NotFoundException(`ToDo List with ID ${id} not found`);
    }
    return todoList;
  }
}
