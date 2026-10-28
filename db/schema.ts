import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const visitors = sqliteTable('like_visitors', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at').notNull()
});
export const likes = sqliteTable('destination_likes', {
  country: text('country').notNull(),
  visitor: text('visitor').notNull().references(() => visitors.id),
  createdAt: integer('created_at').notNull()
}, table => [primaryKey({ columns: [table.country, table.visitor] })]);
