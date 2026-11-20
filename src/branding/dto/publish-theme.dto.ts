import { IsArray, IsObject, IsOptional, IsString, ArrayMinSize } from 'class-validator';
export class PublishThemeDto {
  @IsString() tenantId!: string;
  @IsString() themeId!: string;
  @IsObject() style!: Record<string, unknown>;
  @IsOptional() @IsObject() assets?: Record<string, unknown>;
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) applicationCodes!: string[];
  @IsOptional() @IsString() publishedBy?: string;
}
