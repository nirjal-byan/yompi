import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service.js';
import type { AuthedRequest } from '../types/auth.types.js';

/** Signed in AND on the ADMIN_EMAILS allowlist. Checked on the server for every admin request. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const user = await this.auth.getUserFromRequest(request);
    if (!user) throw new UnauthorizedException();
    if (!user.isAdmin) throw new ForbiddenException('Admin access only');
    request.user = user;
    return true;
  }
}
