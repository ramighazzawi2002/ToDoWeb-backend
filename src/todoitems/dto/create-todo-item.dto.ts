import {
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsISO8601,
  IsMongoId,
} from 'class-validator';

export class CreateTodoItemDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsNotEmpty()
  @IsISO8601()
  dueDate: Date;

  @IsNotEmpty()
  @IsMongoId()
  toDoListId: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;
}
