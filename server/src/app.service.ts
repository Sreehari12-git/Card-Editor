import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from './db/db.module';
import type { DrizzleDb } from './db/db.module';
import * as schema from './db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AppService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDb) {}

  getHello(): string {
    return 'Card Editor API is running!';
  }

  async getCategories() {
    return this.db.select().from(schema.designTemplateCategories);
  }

  async getTemplates() {
    return this.db.select().from(schema.designTemplates);
  }

  async getTemplateById(id: string) {
    const templates = await this.db
      .select()
      .from(schema.designTemplates)
      .where(eq(schema.designTemplates.id, id))
      .limit(1);
    return templates[0] ?? null;
  }
}
