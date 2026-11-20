import { notFound } from "next/navigation";
import { ResourceList } from "@/features/admin/components/resource-list";
import { isResource } from "@/features/admin/config";

export const instant = false;

export default async function AdminResourcePage({ params }: PageProps<"/admin/[resource]">) {
  const { resource } = await params;
  if (!isResource(resource)) notFound();
  return <ResourceList resource={resource} />;
}
