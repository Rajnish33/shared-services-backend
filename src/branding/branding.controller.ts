import { Body, Controller, Get, Post, Query, Param } from '@nestjs/common';
import { BrandingService } from './branding.service';
import { SaveThemeDto } from './dto/save-theme.dto';
import { PublishThemeDto } from './dto/publish-theme.dto';

@Controller('branding')
export class BrandingController {
  constructor(private readonly service: BrandingService) {}

  @Get('config/:applicationCode')
  config(@Param('applicationCode') applicationCode: string, @Query('tenantId') tenantId = 'NPST') {
    return this.service.getConfig(tenantId, applicationCode);
  }

  @Post('drafts')
  saveDraft(@Body() dto: SaveThemeDto) { return this.service.saveDraft(dto); }

  @Get('versions')
  versions(@Query('tenantId') tenantId: string, @Query('applicationCode') applicationCode?: string) {
    return this.service.listVersions(tenantId, applicationCode);
  }

  @Post('publish')
  publish(@Body() dto: PublishThemeDto) { return this.service.publish(dto); }
}
