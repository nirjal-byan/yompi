import type { ItineraryDayInfo, TrekInfo, TrekSummary } from "@yompi/shared";
import { Tag } from "@/components/ui/tag";
import { formatDays, formatMetres } from "../lib/format";
import { findTrekImage } from "../lib/trek-image";
import { BudgetCalculator } from "./budget-calculator";
import { BreadcrumbTrail } from "./breadcrumb-trail";
import { CostList } from "./cost-list";
import { DifficultyPanel } from "./difficulty-panel";
import { ItinerarySection } from "./itinerary-section";
import { PermitList } from "./permit-list";
import { SourceNote } from "./source-note";
import { TrekFactsCard } from "./trek-facts-card";
import { TrekPhoto } from "./trek-photo";

interface TrekDetailProps {
  trek: TrekSummary;
  info: TrekInfo | null;
  itinerary: ItineraryDayInfo[];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border border-border-soft bg-surface p-5">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function GlanceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border border-border-soft bg-surface p-4">
      <span className="font-mono text-[10px] text-muted uppercase">{label}</span>
      <span className="text-base font-semibold">{value}</span>
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 bg-accent-soft p-6">
      <p className="font-display text-xl font-semibold">{title}</p>
      <div className="flex flex-col gap-2 text-sm text-muted">{children}</div>
    </div>
  );
}

export function TrekDetail({ trek, info, itinerary }: TrekDetailProps) {
  const glance = [
    { label: "Duration", value: formatDays(trek) },
    trek.highestPointM && { label: "Highest point", value: formatMetres(trek.highestPointM) },
    trek.startPlace && { label: "Starts", value: trek.startPlace },
    trek.endPlace && { label: "Ends", value: trek.endPlace },
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <div className="flex flex-col gap-6">
      <BreadcrumbTrail
        items={[
          { label: "Explore Nepal", href: "/" },
          { label: "Treks", href: "/treks" },
          { label: trek.name },
        ]}
      />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">{trek.name}</h1>
          <p className="text-muted">{trek.region}</p>
        </div>
        {info?.difficulty && <Tag>{`Difficulty ${info.difficulty.stars} of 5`}</Tag>}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-8">
          <TrekPhoto
            image={findTrekImage(trek.slug)}
            alt={`${trek.name} landscape`}
            caption={`Photo illustration · ${trek.region}`}
            className="min-h-[260px]"
          />

          <Section title="The journey, at a glance">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {glance.map((item) => (
                <GlanceCard key={item.label} {...item} />
              ))}
            </div>
            {info?.source && <SourceNote source={info.source} />}
          </Section>

          <Section title="Itinerary">
            {itinerary.length > 0 ? (
              <ItinerarySection days={itinerary} />
            ) : (
              <p className="border-l-2 border-border-soft pl-3 text-sm text-muted">
                No day-by-day plan has been added for this trek yet. We only show itineraries that
                come with a source.
              </p>
            )}
          </Section>

          {info?.difficulty && (
            <Section title="How hard is it?">
              <DifficultyPanel difficulty={info.difficulty} />
            </Section>
          )}

          {info && info.costs.length > 0 && (
            <Section title="Typical costs">
              <CostList costs={info.costs} />
            </Section>
          )}

          {!info && (
            <p className="border-l-2 border-border-soft pl-3 text-sm text-muted">
              Permit and cost details aren&apos;t available for this trek yet. We only show figures
              that come with a source.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <TrekFactsCard trek={trek} />
          <Notice title="Before you lace up">
            <p>Check current permits, acclimatisation and recent trail reports before you go.</p>
            <p>Altitude is not a game. Descend and get help if you feel unwell.</p>
          </Notice>

          {info && info.permits.length > 0 && (
            <SidePanel title="Permits and fees">
              <PermitList permits={info.permits} />
            </SidePanel>
          )}

          {info && (info.permits.length > 0 || info.costs.length > 0) && (
            <SidePanel title="Plan your budget">
              <BudgetCalculator trek={info} />
            </SidePanel>
          )}
        </div>
      </div>
    </div>
  );
}
