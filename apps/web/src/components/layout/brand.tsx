import Image from "next/image";
import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="YOMPI home">
      <Image src="/brand/yompi-mark.png" alt="" width={44} height={40} priority />
      <span className="flex flex-col leading-none">
        <span className="font-display text-4xl font-semibold lowercase">yompi</span>
        <span className="mt-1 font-mono text-[8px] uppercase tracking-widest text-muted">
          Your Himalayan Buddy
        </span>
      </span>
    </Link>
  );
}
