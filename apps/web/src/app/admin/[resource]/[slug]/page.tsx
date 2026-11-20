import { notFound } from "next/navigation";
import { ResourceForm } from "@/features/admin/components/resource-form";
import { isResource } from "@/features/admin/config";

export const instant = false;

export default async function AdminEditPage({ params }: PageProps<"/admin/[resource]/[slug]">) {
  const { resource, slug } = await params;
  if (!isResource(resource)) notFound();

  return <ResourceForm key={`${resource}/${slug}`} resource={resource} slug={slug} />;
}
