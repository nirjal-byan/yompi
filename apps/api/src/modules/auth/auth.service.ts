import { createHash, randomBytes } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type AuthUser, LOGIN_LINK_TTL_MINUTES, type RequestLinkInput } from "@yompi/shared";
import { PrismaService } from "../../infrastructure/database/prisma.service.js";
import { MailService } from "../../infrastructure/mail/mail.service.js";
import { isAdminEmail, parseAdminEmails } from "./admin-emails.js";

export const SESSION_COOKIE = "yompi_session";
export const SESSION_TTL_DAYS = 30;

const MAX_LINKS_PER_WINDOW = 3;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const newToken = () => randomBytes(32).toString("base64url");

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async requestLink(input: RequestLinkInput): Promise<void> {
    const db = this.prisma.client;
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (input.mode === "login" && !user) return;

    const windowStart = new Date(Date.now() - LOGIN_LINK_TTL_MINUTES * 60_000);
    const recent = await db.loginToken.count({
      where: { email: input.email, createdAt: { gte: windowStart } },
    });
    if (recent >= MAX_LINKS_PER_WINDOW) {
      this.logger.warn("Sign-in link rate limit reached for an address");
      return;
    }

    const name = user?.name ?? (input.mode === "signup" ? input.name : undefined);
    const token = newToken();
    await db.loginToken.create({
      data: {
        tokenHash: sha256(token),
        email: input.email,
        name,
        expiresAt: new Date(Date.now() + LOGIN_LINK_TTL_MINUTES * 60_000),
      },
    });

    const apiUrl = this.config.get<string>("API_PUBLIC_URL") ?? "http://localhost:3001";
    const link = `${apiUrl}/auth/verify?token=${encodeURIComponent(token)}`;
    await this.mail.sendLoginLink(input.email, name ?? input.email, link);
  }

  async verifyLink(token: string): Promise<{ sessionToken: string; user: AuthUser } | null> {
    const db = this.prisma.client;
    const row = await db.loginToken.findUnique({ where: { tokenHash: sha256(token) } });
    if (!row || row.usedAt || row.expiresAt < new Date()) return null;

    const claimed = await db.loginToken.updateMany({
      where: { id: row.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) return null;

    const user = await db.user.upsert({
      where: { email: row.email },
      update: {},
      create: { email: row.email, name: row.name ?? row.email.split("@")[0] },
    });

    const sessionToken = newToken();
    await db.session.create({
      data: {
        tokenHash: sha256(sessionToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000),
      },
    });
    return { sessionToken, user: { id: user.id, email: user.email, name: user.name } };
  }

  async getUserFromRequest(request: { headers: { cookie?: string } }): Promise<AuthUser | null> {
    const token = readCookie(request.headers.cookie, SESSION_COOKIE);
    if (!token) return null;
    const session = await this.prisma.client.session.findUnique({
      where: { tokenHash: sha256(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) return null;
    const { id, email, name } = session.user;
    return { id, email, name, isAdmin: this.isAdmin(email) };
  }

  private isAdmin(email: string): boolean {
    return isAdminEmail(email, parseAdminEmails(this.config.get<string>("ADMIN_EMAILS")));
  }

  async logout(request: { headers: { cookie?: string } }): Promise<void> {
    const token = readCookie(request.headers.cookie, SESSION_COOKIE);
    if (token) {
      await this.prisma.client.session.deleteMany({ where: { tokenHash: sha256(token) } });
    }
  }
}

function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}
