import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateToDoListDto } from './dto/create-todo-list.dto';
import { UpdateToDoListDto } from './dto/update-todo-list.dto';
import { TodolistsService } from './todolists.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

@Controller('todolists')
export class TodolistsController {
  constructor(private readonly todoListService: TodolistsService) {}

  @UseGuards(AuthGuard)
  @Get()
  getAllToDoLists(@Req() req: Request) {
    return this.todoListService.getAllToDoLists(req['user'].id);
  }

  @UseGuards(AuthGuard)
  @Post()
  createToDoList(
    @Body() createToDoListDto: CreateToDoListDto,
    @Req() req: Request,
  ) {
    return this.todoListService.createToDoList(
      createToDoListDto,
      req['user'].id,
    );
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  updateToDoList(
    @Param('id') id: string,
    @Body() updateToDoListDto: UpdateToDoListDto,
  ) {
    return this.todoListService.updateToDoList(id, updateToDoListDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  deleteToDoList(@Param('id') id: string) {
    return this.todoListService.deleteToDoList(id);
  }
}
