"use client";

import { useState } from "react";
import type { ConditionCategory, ConditionInfo } from "@yompi/shared";
import { Select } from "@/components/ui/select";
import { CATEGORY_LABEL, ConditionCard } from "./condition-card";

const ALL = "ALL";

export function ConditionsExplorer({ conditions }: { conditions: ConditionInfo[] }) {
  const [category, setCategory] = useState<ConditionCategory | typeof ALL>(ALL);

  const visible = conditions.filter(
    (condition) => category === ALL || condition.category === category,
  );

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-1 text-sm font-semibold sm:max-w-xs">
        Type
        <Select
          value={category}
          onChange={(event) => setCategory(event.target.value as ConditionCategory | typeof ALL)}
        >
          <option value={ALL}>All reports</option>
          {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </label>

      {visible.length === 0 ? (
        <p className="border border-border-soft bg-surface p-6 text-sm text-muted">
          No reports of this type.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((condition) => (
            <li key={condition.slug}>
              <ConditionCard condition={condition} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
