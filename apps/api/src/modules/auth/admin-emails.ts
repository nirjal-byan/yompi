/**
 * Admin access is an allowlist of email addresses in the ADMIN_EMAILS setting (comma separated).
 * Because sign-in is an emailed link, only the owner of an allowlisted inbox can ever become admin.
 * If the setting is empty, nobody is admin (fails closed).
 */
export function parseAdminEmails(value: string | undefined): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.includes('@')),
  );
}

export function isAdminEmail(email: string, allowlist: Set<string>): boolean {
  return allowlist.has(email.trim().toLowerCase());
}
