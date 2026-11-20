import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
export class SaveThemeDto {
  @IsString() @MaxLength(80) tenantId!: string;
  @IsString() @MaxLength(120) themeId!: string;
  @IsOptional() @IsString() @MaxLength(80) applicationCode?: string;
  @IsObject() style!: Record<string, unknown>;
  @IsOptional() @IsObject() assets?: Record<string, unknown>;
  @IsOptional() @IsString() createdBy?: string;
}
