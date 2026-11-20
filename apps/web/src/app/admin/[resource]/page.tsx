import { notFound } from "next/navigation";
import { ResourceList } from "@/features/admin/components/resource-list";
import { isResource } from "@/features/admin/config";

// Private, signed-in-only page: it is always rendered per request, so it opts out of the instant-navigation check.
export const instant = false;

export default async function AdminResourcePage({ params }: PageProps<"/admin/[resource]">) {
  const { resource } = await params;
  if (!isResource(resource)) notFound();
  return <ResourceList resource={resource} />;
}
