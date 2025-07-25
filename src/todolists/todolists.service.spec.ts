import { Test, TestingModule } from '@nestjs/testing';
import { TodolistsService } from './todolists.service';

describe('TodolistsService', () => {
  let service: TodolistsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TodolistsService],
    }).compile();

    service = module.get<TodolistsService>(TodolistsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
