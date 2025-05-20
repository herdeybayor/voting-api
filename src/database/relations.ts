import { relations } from 'drizzle-orm';
import { users } from './schema/users.schema';
import { refreshTokens, oauthAccounts, otps } from './schema/auth.schema';
import { competitions, options, votes } from './schema/voting.schema';

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  createdCompetitions: many(competitions, { relationName: 'user_competitions' }),
  votes: many(votes),
  refreshTokens: many(refreshTokens),
  oauthAccounts: many(oauthAccounts),
  otps: many(otps),
}));

// Competition relations
export const competitionsRelations = relations(competitions, ({ one, many }) => ({
  creator: one(users, {
    fields: [competitions.creatorId],
    references: [users.id],
    relationName: 'user_competitions',
  }),
  options: many(options),
  votes: many(votes),
}));

// Option relations
export const optionsRelations = relations(options, ({ one, many }) => ({
  competition: one(competitions, {
    fields: [options.competitionId],
    references: [competitions.id],
  }),
  votes: many(votes),
}));

// Vote relations
export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  option: one(options, {
    fields: [votes.optionId],
    references: [options.id],
  }),
  competition: one(competitions, {
    fields: [votes.competitionId],
    references: [competitions.id],
  }),
}));

// Auth relations
export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));

export const otpsRelations = relations(otps, ({ one }) => ({
  user: one(users, {
    fields: [otps.userId],
    references: [users.id],
  }),
}));
