import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "../../modules/auth/auth.service.js";
import type { AuthedRequest } from "../types/auth.types.js";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const user = await this.auth.getUserFromRequest(request);
    if (!user) throw new UnauthorizedException();
    request.user = user;
    return true;
  }
}
