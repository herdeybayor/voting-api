import { boolean, pgEnum, pgTable, primaryKey, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export type OTPType = (typeof otpTypeEnum.enumValues)[number];
export const otpTypeEnum = pgEnum('otp_type', ['email_verification', 'password_reset']);

export type RefreshToken = typeof refreshTokens.$inferSelect;
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid().defaultRandom().primaryKey(),
  token: text().notNull().unique(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  revoked: boolean().default(false),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar({ length: 50 }).notNull(), // 'google' or 'apple'
    providerId: text().notNull(), // Provider's unique identifier
    email: varchar({ length: 255 }).notNull(),
    accessToken: text().notNull(),
    refreshToken: text(),
    tokenExpiresAt: timestamp(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
  },
  (t) => [
    // Ensure each user can only have one account per provider
    primaryKey({ columns: [t.userId, t.provider] }),
  ],
);

export type OTP = typeof otps.$inferSelect;
export const otps = pgTable('otps', {
  id: uuid().defaultRandom().primaryKey(),
  type: otpTypeEnum('type').notNull(),
  userId: uuid().references(() => users.id, { onDelete: 'cascade' }),
  email: varchar({ length: 255 }).notNull(),
  otp: text().notNull(),
  isUsed: boolean('is_used').notNull().default(false),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});
