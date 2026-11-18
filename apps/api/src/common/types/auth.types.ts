import type { Request } from 'express';
import type { AuthUser } from '@yompi/shared';

export interface AuthedRequest extends Request {
  user: AuthUser;
}
