import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThemeVersion } from './theme-version.entity';
import { BrandingService } from './branding.service';
import { BrandingController } from './branding.controller';
import { ApplicationsModule } from '../applications/applications.module';
@Module({ imports: [TypeOrmModule.forFeature([ThemeVersion]), ApplicationsModule], providers: [BrandingService], controllers: [BrandingController] })
export class BrandingModule {}
