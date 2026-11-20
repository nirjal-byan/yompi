"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "../services/auth-api";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="outline"
      className={className}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await logout();
        router.replace("/join");
        router.refresh();
      }}
    >
      Log out
    </Button>
  );
}
