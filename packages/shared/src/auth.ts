import { z } from "zod";

/** How long an emailed sign-in link stays valid. */
export const LOGIN_LINK_TTL_MINUTES = 15;

const EmailSchema = z.string().trim().toLowerCase().email().max(254);

export const RequestLinkSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("login"), email: EmailSchema }),
  z.object({
    mode: z.literal("signup"),
    email: EmailSchema,
    name: z.string().trim().min(1, "Please tell us what to call you").max(80),
  }),
]);
export type RequestLinkInput = z.infer<typeof RequestLinkSchema>;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}
