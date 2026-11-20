import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

/** The public website: navbar on top, footer at the bottom. The admin area has its own layout instead. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
    </>
  );
}
