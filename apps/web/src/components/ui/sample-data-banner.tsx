export function SampleDataBanner({ children }: { children: React.ReactNode }) {
  return (
    <p role="note" className="border-2 border-foreground bg-primary/30 px-4 py-3 text-sm">
      <span className="font-semibold">Sample data. </span>
      {children}
    </p>
  );
}
