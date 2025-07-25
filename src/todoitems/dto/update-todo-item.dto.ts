import { IsOptional, IsBoolean, IsString } from 'class-validator';

export class UpdateToDoItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
