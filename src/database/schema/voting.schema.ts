import { pgTable, text, timestamp, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

// Competitions Schema
export type Competition = typeof competitions.$inferSelect;
export type NewCompetition = typeof competitions.$inferInsert;

export const competitions = pgTable('competitions', {
  id: uuid().defaultRandom().primaryKey(),
  title: text().notNull(),
  description: text().notNull(),
  endDate: timestamp().notNull(),
  creatorId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
  deletedAt: timestamp(),
});

// Options Schema
export type Option = typeof options.$inferSelect;
export type NewOption = typeof options.$inferInsert;

export const options = pgTable('options', {
  id: uuid().defaultRandom().primaryKey(),
  title: text().notNull(),
  description: text(),
  competitionId: uuid()
    .notNull()
    .references(() => competitions.id, { onDelete: 'cascade' }),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// Votes Schema
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;

export const votes = pgTable(
  'votes',
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    optionId: uuid()
      .notNull()
      .references(() => options.id, { onDelete: 'cascade' }),
    competitionId: uuid()
      .notNull()
      .references(() => competitions.id, { onDelete: 'cascade' }),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (t) => ({
    // Each user can vote only once per competition
    pk: primaryKey({ columns: [t.userId, t.competitionId] }),
  }),
);
