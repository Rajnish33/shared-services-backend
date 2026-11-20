import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
@Controller('auth')
export class MockAuthController {
  @Get('me') me(@Headers('x-mock-user') user?: string) {
    if (process.env.MOCK_AUTH_ENABLED !== 'true') throw new UnauthorizedException('Mock authentication is disabled');
    if (!user) throw new UnauthorizedException('For local development send x-mock-user: admin@npst.com');
    return { id: user, email: user, displayName: user.split('@')[0], roles: ['SUPER_ADMIN'], authMode: 'MOCK_ONLY' };
  }
}
