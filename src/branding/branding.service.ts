import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ThemeVersion } from './theme-version.entity';
import { ApplicationsService } from '../applications/applications.service';

@Injectable()
export class BrandingService {
  constructor(@InjectRepository(ThemeVersion) private readonly themes: Repository<ThemeVersion>, private readonly applications: ApplicationsService) {}

  async getConfig(tenantId: string, applicationCode: string) {
    const row = await this.themes.findOne({
      where: { tenantId, applicationCode, status: 'DRAFT' },
      order: { createdAt: 'DESC' },
    }) ?? await this.themes.findOne({
      where: { tenantId, applicationCode, status: 'PUBLISHED' },
      order: { version: 'DESC' },
    });
    if (!row) return null;
    const configuration = row.configuration as { style?: Record<string, unknown>; assets?: Record<string, unknown> };
    return { ...row, style: configuration.style ?? {}, assets: configuration.assets ?? {} };
  }

  async saveDraft(input: { tenantId: string; themeId: string; applicationCode?: string; style: Record<string, unknown>; assets?: Record<string, unknown>; createdBy?: string }) {
    if (!input.tenantId || !input.themeId || !input.style) throw new BadRequestException('tenantId, themeId and style are required');
    const applicationCode = input.applicationCode ?? 'SHARED';
    let draft = await this.themes.findOne({ where: { tenantId: input.tenantId, applicationCode, status: 'DRAFT' }, order: { createdAt: 'DESC' } });
    const config = { style: input.style, assets: input.assets ?? {} };
    if (draft) {
      draft.themeId = input.themeId;
      draft.configuration = config;
      draft.createdBy = input.createdBy ?? 'local-admin';
    } else {
      draft = this.themes.create({ tenantId: input.tenantId, applicationCode, themeId: input.themeId, version: 0, configuration: config, createdBy: input.createdBy ?? 'local-admin', status: 'DRAFT' });
    }
    return this.themes.save(draft);
  }

  async listVersions(tenantId: string, applicationCode?: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    return this.themes.find({ where: { tenantId, status: 'PUBLISHED', ...(applicationCode ? { applicationCode } : {}) }, order: { createdAt: 'DESC' } });
  }

  async publish(input: { tenantId: string; themeId: string; style: Record<string, unknown>; assets?: Record<string, unknown>; applicationCodes: string[]; publishedBy?: string }) {
    const apps = await this.applications.findByCodes(input.applicationCodes);
    if (apps.length !== new Set(input.applicationCodes).size) throw new NotFoundException('One or more applicationCodes are unknown or inactive');
    const outcomes: Array<Record<string, unknown>> = [];
    for (const app of apps) {
      try {
        // The receiver owns the authoritative version sequence. The Shared Services
        // database may be new or may have missed publications, so never rely on its
        // local history alone when choosing the next receiver version.
        const latest = await this.themes.findOne({ where: { tenantId: input.tenantId, applicationCode: app.code }, order: { version: 'DESC' } });
        const receiverVersion = await this.getReceiverCurrentVersion(app.webhookUrl, input.tenantId);
        const version = Math.max(latest?.version ?? 0, receiverVersion) + 1;
        const payload = this.toWebhookPayload(app.code, input.tenantId, input.themeId, version, input.style, input.assets ?? {});
        const response = await fetch(app.webhookUrl, { method: 'POST', headers: { 'content-type': 'application/json', 'x-branding-secret': app.webhookSecret }, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) });
        const responseBody = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(`Receiver returned HTTP ${response.status}: ${JSON.stringify(responseBody)}`);
        const row = this.themes.create({ tenantId: input.tenantId, applicationCode: app.code, themeId: input.themeId, version, configuration: payload, createdBy: input.publishedBy ?? 'local-admin', status: 'PUBLISHED' });
        await this.themes.save(row);
        outcomes.push({ applicationCode: app.code, status: 'PUBLISHED', version, receiver: responseBody });
      } catch (error) {
        outcomes.push({ applicationCode: app.code, status: 'FAILED', error: error instanceof Error ? error.message : 'Unknown publishing error' });
      }
    }
    return { tenantId: input.tenantId, themeId: input.themeId, results: outcomes, successCount: outcomes.filter(x => x.status === 'PUBLISHED').length, failureCount: outcomes.filter(x => x.status === 'FAILED').length };
  }


  private async getReceiverCurrentVersion(webhookUrl: string, tenantId: string): Promise<number> {
    const currentUrl = new URL(webhookUrl);
    // Existing receivers expose POST /webhooks/theme and GET /theme/current.
    currentUrl.pathname = currentUrl.pathname.replace(/\/webhooks\/theme\/?$/, '/theme/current');
    if (currentUrl.pathname.endsWith('/webhooks/theme')) {
      throw new Error(`Cannot derive current-theme URL from webhook URL: ${webhookUrl}`);
    }
    currentUrl.search = new URLSearchParams({ tenantId }).toString();
    currentUrl.hash = '';

    const response = await fetch(currentUrl, { method: 'GET', signal: AbortSignal.timeout(10000) });
    if (response.status === 404) return 0; // Receiver has not received a theme yet.
    const body = await response.json().catch(() => ({})) as { version?: unknown };
    if (!response.ok) {
      throw new Error(`Could not read current theme from receiver (HTTP ${response.status}): ${JSON.stringify(body)}`);
    }
    const version = Number(body.version ?? 0);
    if (!Number.isInteger(version) || version < 0) {
      throw new Error(`Receiver returned an invalid current theme version: ${String(body.version)}`);
    }
    return version;
  }

  private toWebhookPayload(code: string, tenantId: string, themeId: string, version: number, style: Record<string, unknown>, assets: Record<string, unknown>) {
    const get = (key: string, fallback: unknown) => style[key] ?? fallback;
    const primary = get('primary', '#7138A5');
    const colors = { primary, secondary: get('secondary', '#75677E'), background: get('bg', '#F8F5FC'), surface: get('cardBg', '#FFFFFF'), text: get('text', '#30213E'), sidebar: get('sidebarBg', primary), success: '#16845B', danger: '#C43D4B', border: get('borderColor', '#E8DFF0') };
    const size = (v: unknown, fallback: string) => typeof v === 'number' ? `${v}px` : (typeof v === 'string' ? v : fallback);
    return { tenantId, applicationId: code, themeId, version, mode: 'light', branding: { appName: code === 'PEOPLE_OS' ? 'People OS' : 'HelpDesk', logoUrl: String(assets.logo ?? ''), faviconUrl: String(assets.favicon ?? '') }, colors, typography: { fontFamily: get('fontFamily', 'Inter, Arial, sans-serif'), headingSize: size(get('headingSize', 24), '24px'), bodySize: size(get('bodySize', 14), '14px') }, components: { borderRadius: size(get('radius', 10), '10px'), buttonStyle: get('componentStyle', 'rounded'), cardStyle: get('shadow', 'elevated') } };
  }
}
