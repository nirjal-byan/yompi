import type { DifficultyEstimate } from "@yompi/shared";

export function DifficultyStars({ stars }: { stars: number }) {
  return (
    <span aria-label={`${stars} out of 5`} className="text-lg leading-none tracking-wide">
      {"★".repeat(stars)}
      <span className="text-border-soft">{"★".repeat(5 - stars)}</span>
    </span>
  );
}

export function DifficultyPanel({ difficulty }: { difficulty: DifficultyEstimate }) {
  return (
    <div>
      <p className="flex items-center gap-2">
        <DifficultyStars stars={difficulty.stars} />
        <span className="text-sm text-muted">
          {difficulty.stars} of 5 · {difficulty.points} of {difficulty.maxPoints} points
        </span>
      </p>
      <details className="mt-1 text-sm">
        <summary className="cursor-pointer text-accent underline">Why this rating?</summary>
        <ul className="mt-2 flex flex-col gap-1">
          {difficulty.factors.map((factor) => (
            <li key={factor.label} className="flex justify-between gap-3">
              <span>
                <span className="font-medium">{factor.label}:</span>{" "}
                <span className="text-muted">{factor.detail}</span>
              </span>
              <span className="font-mono text-xs">+{factor.points}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-muted">{difficulty.caveat}</p>
      </details>
    </div>
  );
}
