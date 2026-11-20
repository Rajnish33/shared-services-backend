import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './application.entity';
@Injectable()
export class ApplicationsService implements OnModuleInit {
  constructor(@InjectRepository(Application) private readonly repo: Repository<Application>) {}
  async onModuleInit() {
    const defaults = [
      { code: 'PEOPLE_OS', name: 'People OS', webhookUrl: process.env.PEOPLE_OS_WEBHOOK_URL, webhookSecret: process.env.PEOPLE_OS_WEBHOOK_SECRET },
      { code: 'HELPDESK', name: 'HelpDesk', webhookUrl: process.env.HELPDESK_WEBHOOK_URL, webhookSecret: process.env.HELPDESK_WEBHOOK_SECRET },
    ];
    for (const item of defaults) if (item.webhookUrl && item.webhookSecret && !(await this.repo.findOne({ where: { code: item.code } }))) await this.repo.save(this.repo.create({ ...item, active: true }));
  }
  list() { return this.repo.find({ select: { id: true, code: true, name: true, active: true, createdAt: true, updatedAt: true }, order: { name: 'ASC' } }); }
  findByCodes(codes: string[]) { return this.repo.findBy(codes.map((code) => ({ code, active: true }))); }
}
