import { IsOptional, IsString } from 'class-validator';

export class UpdateToDoListDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
