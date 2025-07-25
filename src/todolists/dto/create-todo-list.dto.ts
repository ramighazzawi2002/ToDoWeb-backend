import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateToDoListDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description: string;

  @IsOptional()
  userId: string;
}
