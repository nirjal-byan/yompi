"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LOGIN_LINK_TTL_MINUTES } from "@yompi/shared";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { requestLoginLink } from "../services/auth-api";

type Mode = "signup" | "login";

export function JoinForm() {
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    params.get("error") === "invalid-link"
      ? "That sign-in link has expired or was already used. Request a new one below."
      : null,
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    const failure = await requestLoginLink(
      mode === "signup" ? { mode, email, name } : { mode, email },
    );
    setSending(false);
    if (failure) setError(failure);
    else setSentTo(email.trim().toLowerCase());
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4 border border-border bg-surface p-6" role="status">
        <h2 className="font-display text-2xl">Check your email</h2>
        <p className="text-sm text-muted">
          If <strong className="text-foreground">{sentTo}</strong> can sign in, a link is on its
          way. It expires in {LOGIN_LINK_TTL_MINUTES} minutes and works once.
        </p>
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className="self-start text-sm text-accent underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === value}
      onClick={() => {
        setMode(value);
        setError(null);
      }}
      className={cn(
        "h-[39px] flex-1 text-sm font-medium transition-colors",
        mode === value ? "bg-foreground text-background" : "bg-surface-muted hover:bg-border-soft",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex">
        {tab("signup", "Create account")}
        {tab("login", "Log in")}
      </div>

      <Button
        variant="outline"
        disabled
        title="Google sign-in is coming soon"
        className="h-[39px] border-border/60"
      >
        Continue with Google
      </Button>

      <p className="text-center text-xs text-muted">or use your email</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Always rendered so switching tabs never changes the layout height. */}
        <div className={cn(mode === "login" && "invisible")} inert={mode === "login"}>
          <Field label="Your name" htmlFor="name">
            <Input
              id="name"
              required={mode === "signup"}
              maxLength={80}
              autoComplete="name"
              placeholder="What should we call you?"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Email address" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Button type="submit" disabled={sending}>
          {sending ? "Sending…" : mode === "signup" ? "Send me a sign-up link →" : "Send me a login link →"}
        </Button>
      </form>

      {/* Fixed-height slot: an error replaces the note instead of pushing content down. */}
      {error ? (
        <p role="alert" className="min-h-9 text-xs text-red-700">
          {error}
        </p>
      ) : (
        <p className="min-h-9 text-xs text-muted">
          No password to remember. Your link will expire in {LOGIN_LINK_TTL_MINUTES} minutes. By
          continuing, you agree to the Terms and Privacy Policy.
        </p>
      )}
      <p className="text-sm text-accent">
        Just looking around?{" "}
        <Link href="/" className="underline">
          Explore without an account →
        </Link>
      </p>
    </div>
  );
}
