import { Test, TestingModule } from '@nestjs/testing';
import { TodolistsController } from './todolists.controller';

describe('TodolistsController', () => {
  let controller: TodolistsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodolistsController],
    }).compile();

    controller = module.get<TodolistsController>(TodolistsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
