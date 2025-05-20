import { Profile, Strategy } from '@arendajaelu/nestjs-passport-apple';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { OAuthService } from '../services/oauth.service';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {
    const privateKey = configService.getOrThrow('APPLE_PRIVATE_KEY');
    const privateKeyBuffer = Buffer.from(privateKey, 'base64');
    const privateKeyString = privateKeyBuffer.toString('utf-8');
    super({
      clientID: configService.getOrThrow('APPLE_CLIENT_ID'),
      teamID: configService.getOrThrow('APPLE_TEAM_ID'),
      keyID: configService.getOrThrow('APPLE_KEY_ID'),
      key: privateKeyString,
      callbackURL: configService.getOrThrow('APPLE_CALLBACK_URL'),
      passReqToCallback: false,
      scope: ['email', 'name'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile, done: (err: any, user: any) => void) {
    const { id, name, email } = profile;

    const user = {
      id,
      email,
      firstName: name?.firstName || '',
      lastName: name?.lastName || '',
      image: '',
    };

    const tokens = {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
    };

    const result = await this.oauthService.handleOAuthLogin('apple', user, tokens);

    done(null, result);
  }
}
