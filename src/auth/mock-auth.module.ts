import { Module } from '@nestjs/common';
import { MockAuthController } from './mock-auth.controller';
@Module({ controllers: [MockAuthController] })
export class MockAuthModule {}
