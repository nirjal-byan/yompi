import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { type AuthUser, RequestLinkSchema } from '@yompi/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { SessionGuard } from '../../common/guards/session.guard.js';
import { AuthService, SESSION_COOKIE, SESSION_TTL_DAYS } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('request-link')
  @HttpCode(202)
  async requestLink(@Body() body: unknown) {
    const parsed = RequestLinkSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
    }
    await this.auth.requestLink(parsed.data);
    return { ok: true };
  }

  /** Target of the emailed link: opens a session, then sends the browser to the web app. */
  @Get('verify')
  async verify(@Query('token') token: string | undefined, @Res() res: Response) {
    const webUrl = this.config.get<string>('WEB_URL') ?? 'http://localhost:3000';
    const result = token ? await this.auth.verifyLink(token) : null;
    if (!result) return res.redirect(`${webUrl}/join?error=invalid-link`);

    res.cookie(SESSION_COOKIE, result.sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get<string>('NODE_ENV') === 'production',
      maxAge: SESSION_TTL_DAYS * 86_400_000,
      path: '/',
    });
    return res.redirect(`${webUrl}/adventures`);
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
  }
}
