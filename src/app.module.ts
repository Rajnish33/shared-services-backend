import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandingModule } from './branding/branding.module';
import { ApplicationsModule } from './applications/applications.module';
import { MockAuthModule } from './auth/mock-auth.module';
import { HealthController } from './common/health.controller';
import { ThemeVersion } from './branding/theme-version.entity';
import { Application } from './applications/application.entity';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }), TypeOrmModule.forRoot({ type: 'mysql', host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3309), username: process.env.DB_USERNAME || 'shared_app', password: process.env.DB_PASSWORD || 'shared_local_password', database: process.env.DB_NAME || 'npst_shared_services', entities: [ThemeVersion, Application], synchronize: true }), MockAuthModule, ApplicationsModule, BrandingModule],
  controllers: [HealthController],
})
export class AppModule {}
