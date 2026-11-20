export function parseAdminEmails(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.includes("@")),
  );
}

export function isAdminEmail(email: string, allowlist: Set<string>): boolean {
  return allowlist.has(email.trim().toLowerCase());
}
