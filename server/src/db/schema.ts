import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const designTemplateCategories = pgTable('design_template_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const designTemplates = pgTable('design_templates', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  categoryId: text('category_id').references(
    () => designTemplateCategories.id,
    { onDelete: 'set null' },
  ),
  countryCode: text('country_code').default('CA'),
  style: text('style'),
  widthPx: integer('width_px').default(1050),
  heightPx: integer('height_px').default(600),
  dpi: integer('dpi').default(300),
  polotnoJson: jsonb('polotno_json'),
  editableVariables: jsonb('editable_variables'),
  isSystemTemplate: boolean('is_system_template').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  imglyTemplate: jsonb('imgly_template'),
});

export const categoriesRelations = relations(
  designTemplateCategories,
  ({ many }) => ({
    templates: many(designTemplates),
  }),
);

export const templatesRelations = relations(designTemplates, ({ one }) => ({
  category: one(designTemplateCategories, {
    fields: [designTemplates.categoryId],
    references: [designTemplateCategories.id],
  }),
}));
