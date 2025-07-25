import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CreateTodoItemDto } from './dto/create-todo-item.dto';
import { UpdateToDoItemDto } from './dto/update-todo-item.dto';
import { TodoitemsService } from './todoitems.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('todoitems')
export class TodoitemsController {
  constructor(private readonly todoItemsService: TodoitemsService) {}

  @UseGuards(AuthGuard)
  @Post()
  async addToItem(@Body() createToDoItemDto: CreateTodoItemDto) {
    return await this.todoItemsService.addToItem(createToDoItemDto);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  async updateToDoItem(
    @Param('id') id: string,
    @Body() updateToDoItemDto: UpdateToDoItemDto,
  ) {
    return this.todoItemsService.updateToDoItem(id, updateToDoItemDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async deleteToDoItem(@Param('id') id: string) {
    return this.todoItemsService.deleteToDoItem(id);
  }
}
