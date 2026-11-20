import { notFound } from "next/navigation";
import { ResourceForm } from "@/features/admin/components/resource-form";
import { isResource } from "@/features/admin/config";

/** `new` creates a record; anything else is the id of the record to edit. */
// Private, signed-in-only page: it is always rendered per request, so it opts out of the instant-navigation check.
export const instant = false;

export default async function AdminEditPage({ params }: PageProps<"/admin/[resource]/[slug]">) {
  const { resource, slug } = await params;
  if (!isResource(resource)) notFound();
  // key makes the form start fresh when moving between records.
  return <ResourceForm key={`${resource}/${slug}`} resource={resource} slug={slug} />;
}
