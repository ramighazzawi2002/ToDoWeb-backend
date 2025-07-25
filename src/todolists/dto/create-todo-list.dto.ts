import { IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class CreateToDoListDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description: string;

  @IsNotEmpty()
  @IsMongoId()
  userId: string;
}
