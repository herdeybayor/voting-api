import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { User } from 'src/users/interfaces/user.interface';
import { DrizzleService } from '../../database/drizzle.service';
import { oauthAccounts } from '../../database/schema/auth.schema';
import { users } from '../../database/schema/users.schema';

@Injectable()
export class OAuthService {
  constructor(private readonly drizzle: DrizzleService) {}

  async handleOAuthLogin(
    provider: 'google' | 'apple',
    profile: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      image?: string;
    },
    tokens: {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: Date;
    },
  ): Promise<User> {
    // Check if OAuth account exists
    const oauthAccount = await this.drizzle.db.query.oauthAccounts.findFirst({
      where: eq(oauthAccounts.providerId, profile.id),
    });

    let user: User | undefined;

    if (oauthAccount) {
      // Update tokens
      await this.drizzle.db
        .update(oauthAccounts)
        .set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.expiresAt,
        })
        .where(and(eq(oauthAccounts.userId, oauthAccount.userId), eq(oauthAccounts.provider, provider)));

      user = await this.drizzle.db.query.users.findFirst({
        where: eq(users.id, oauthAccount.userId),
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    }

    // Check if user exists with the same email
    user = await this.drizzle.db.query.users.findFirst({
      where: eq(users.email, profile.email.toLowerCase()),
    });

    // If user doesn't exist, create one
    if (!user) {
      [user] = await this.drizzle.db
        .insert(users)
        .values({
          email: profile.email.toLowerCase(),
          firstName: profile.firstName,
          lastName: profile.lastName,
          image: profile.image || '',
          password: '', // Empty password for OAuth users
          isEmailVerified: true, // OAuth emails are pre-verified
        })
        .returning();
    }

    // Create OAuth account
    await this.drizzle.db.insert(oauthAccounts).values({
      userId: user.id,
      provider,
      providerId: profile.id,
      email: profile.email,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresAt,
    });

    return user;
  }
}
