// The whole admin area depends on who is signed in, so it is never prerendered or checked for instant navigation.
export const instant = false;

import { Dashboard } from "@/features/admin/components/dashboard";

export default function AdminHome() {
  return <Dashboard />;
}
