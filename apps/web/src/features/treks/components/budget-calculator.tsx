"use client";

import { useMemo, useState } from "react";
import type { AccommodationTier, TrekInfo } from "@yompi/shared";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { calculateBudget, type BudgetInput } from "../lib/budget";
import { formatNpr } from "../lib/format";
import { TIER_LABEL } from "../lib/tiers";

const MAX_GROUP_SIZE = 30;
const MAX_PORTERS = 20;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value) || min, min), max);
}

export function BudgetCalculator({ trek }: { trek: TrekInfo }) {
  const [input, setInput] = useState<BudgetInput>({
    groupSize: 2,
    days: trek.minDays,
    tier: "BUDGET",
    includeGuide: false,
    porters: 0,
  });

  const budget = useMemo(
    () => calculateBudget(input, trek.permits, trek.costs),
    [input, trek.permits, trek.costs],
  );
  const update = (changes: Partial<BudgetInput>) =>
    setInput((current) => ({ ...current, ...changes }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Group size" htmlFor="budget-group">
          <Input
            id="budget-group"
            type="number"
            min={1}
            max={MAX_GROUP_SIZE}
            value={input.groupSize}
            onChange={(event) =>
              update({ groupSize: clamp(+event.target.value, 1, MAX_GROUP_SIZE) })
            }
          />
        </Field>
        <Field label="Days" htmlFor="budget-days">
          <Input
            id="budget-days"
            type="number"
            min={trek.minDays}
            max={trek.maxDays}
            value={input.days}
            onChange={(event) =>
              update({ days: clamp(+event.target.value, trek.minDays, trek.maxDays) })
            }
          />
        </Field>
        <Field label="Lodging" htmlFor="budget-tier">
          <Select
            id="budget-tier"
            value={input.tier}
            onChange={(event) => update({ tier: event.target.value as AccommodationTier })}
          >
            {Object.entries(TIER_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Porters" htmlFor="budget-porters">
          <Input
            id="budget-porters"
            type="number"
            min={0}
            max={MAX_PORTERS}
            value={input.porters}
            onChange={(event) => update({ porters: clamp(+event.target.value, 0, MAX_PORTERS) })}
          />
        </Field>
        <label className="col-span-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={input.includeGuide}
            onChange={(event) => update({ includeGuide: event.target.checked })}
            className="accent-foreground"
          />
          Hire a guide
        </label>
      </div>

      <div className="flex flex-col gap-3">
        <ul className="flex flex-col gap-1.5 text-sm">
          {budget.lines.map((line) => (
            <li key={line.label} className="flex justify-between gap-3">
              <span className="text-muted">{line.label}</span>
              <span className="font-medium">
                {line.amountNpr === null ? "no sourced rate" : formatNpr(line.amountNpr)}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-border-soft pt-3" aria-live="polite">
          <p className="font-mono text-[10px] text-muted uppercase">Estimated total</p>
          <p className="font-display text-3xl font-semibold">{formatNpr(budget.totalNpr)}</p>
          <p className="text-sm text-muted">{formatNpr(budget.perPersonNpr)} per person</p>
        </div>
        {budget.missing.length > 0 && (
          <p className="text-[11px] text-muted">
            Not included, because no sourced rate has been added: {budget.missing.join(", ")}.
          </p>
        )}
      </div>
    </div>
  );
}
