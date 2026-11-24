import { Suspense } from "react";
import { ExploreMap } from "@/features/map/components/explore-map";

interface HomeProps {
  searchParams: Promise<{ trail?: string }>;
}

async function MapWithSelection({ searchParams }: HomeProps) {
  const { trail } = await searchParams;

  return <ExploreMap initialFeatureId={trail ?? null} />;
}

export default function Home(props: HomeProps) {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <MapWithSelection {...props} />
    </Suspense>
  );
}
