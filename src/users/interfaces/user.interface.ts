import { users } from 'src/database/schema';

export type User = typeof users.$inferSelect;
