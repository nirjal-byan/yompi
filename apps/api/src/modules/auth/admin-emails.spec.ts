import { isAdminEmail, parseAdminEmails } from './admin-emails.js';

describe('admin email allowlist', () => {
  it('nobody is admin when the setting is empty or missing (fails closed)', () => {
    expect(isAdminEmail('owner@example.com', parseAdminEmails(undefined))).toBe(false);
    expect(isAdminEmail('owner@example.com', parseAdminEmails(''))).toBe(false);
    expect(isAdminEmail('owner@example.com', parseAdminEmails(' , ,'))).toBe(false);
  });

  it('matches case-insensitively and ignores surrounding spaces', () => {
    const allowlist = parseAdminEmails(' Owner@Example.com , second@example.com ');
    expect(isAdminEmail('owner@example.com', allowlist)).toBe(true);
    expect(isAdminEmail('  OWNER@EXAMPLE.COM ', allowlist)).toBe(true);
    expect(isAdminEmail('second@example.com', allowlist)).toBe(true);
  });

  it('does not match other addresses, including look-alikes', () => {
    const allowlist = parseAdminEmails('owner@example.com');
    expect(isAdminEmail('someone@example.com', allowlist)).toBe(false);
    expect(isAdminEmail('owner@example.com.evil.org', allowlist)).toBe(false);
    expect(isAdminEmail('xowner@example.com', allowlist)).toBe(false);
  });

  it('ignores entries that are not email addresses', () => {
    expect(parseAdminEmails('not-an-email, owner@example.com').size).toBe(1);
  });
});
