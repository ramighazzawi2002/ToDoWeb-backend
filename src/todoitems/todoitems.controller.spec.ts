import { Test, TestingModule } from '@nestjs/testing';
import { TodoitemsController } from './todoitems.controller';

describe('TodoitemsController', () => {
  let controller: TodoitemsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoitemsController],
    }).compile();

    controller = module.get<TodoitemsController>(TodoitemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
