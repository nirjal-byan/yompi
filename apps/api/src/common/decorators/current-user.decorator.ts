import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthUser } from "@yompi/shared";
import type { AuthedRequest } from "../types/auth.types.js";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<AuthedRequest>().user,
);
