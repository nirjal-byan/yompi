import { ButtonLink } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { getCurrentUser } from "@/features/auth/services/session";

export async function NavbarActions() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <ButtonLink href="/join" className="h-10">
        Sign up
      </ButtonLink>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <ButtonLink href="/treks" className="hidden h-10 sm:inline-flex">
        Plan a trek <span aria-hidden>↗</span>
      </ButtonLink>
      <LogoutButton className="h-10 px-3 text-xs" />
    </div>
  );
}
