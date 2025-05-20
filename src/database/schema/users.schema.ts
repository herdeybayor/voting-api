import { pgTable, text, timestamp, varchar, boolean, uuid, pgEnum } from 'drizzle-orm/pg-core';

import { SQL, sql } from 'drizzle-orm';

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);

export type User = typeof users.$inferSelect;
export const users = pgTable('users', {
  id: uuid().defaultRandom().primaryKey(),
  firstName: varchar({ length: 255 }).notNull(),
  lastName: varchar({ length: 255 }).notNull(),
  fullName: text().generatedAlwaysAs((): SQL => sql`${users.firstName} || ' ' || ${users.lastName}`),
  email: varchar({ length: 255 }).notNull().unique(),
  isEmailVerified: boolean().default(false).notNull(),
  image: text(),
  // Password should be hashed using bcrypt before storage
  password: varchar({ length: 255 }).notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
  deletedAt: timestamp(),
});
