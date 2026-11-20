"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Elevation profile of one continuous trail section. Loaded lazily: Recharts is only fetched when a trail is opened. */
export default function ElevationChart({ elevationsM, spacingKm }: { elevationsM: number[]; spacingKm: number }) {
  const data = useMemo(
    () => elevationsM.map((m, i) => ({ km: Math.round(i * spacingKm * 100) / 100, m })),
    [elevationsM, spacingKm],
  );

  return (
    <div className="h-[150px] w-full" role="img" aria-label="Elevation profile of the selected trail section">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#e2dccf" vertical={false} />
          <XAxis
            dataKey="km"
            type="number"
            domain={[0, "dataMax"]}
            tickFormatter={(v: number) => `${Math.round(v)}`}
            tick={{ fontSize: 10, fill: "#6b625a" }}
            axisLine={{ stroke: "#3b2a26" }}
            tickLine={false}
            unit=" km"
          />
          <YAxis
            width={44}
            domain={[(min: number) => Math.floor((min - 100) / 100) * 100, (max: number) => Math.ceil((max + 100) / 100) * 100]}
            tickFormatter={(v: number) => `${v.toLocaleString("en-US")}`}
            tick={{ fontSize: 10, fill: "#6b625a" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            isAnimationActive={false}
            contentStyle={{ border: "1px solid #3b2a26", borderRadius: 0, fontSize: 12, background: "#fffdf8" }}
            formatter={(value) => [`${Number(value).toLocaleString("en-US")} m`, "Elevation"]}
            labelFormatter={(label) => `${label} km from section start`}
          />
          <Area type="monotone" dataKey="m" stroke="#3b2a26" strokeWidth={1.5} fill="#ffb43e" fillOpacity={0.55} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
