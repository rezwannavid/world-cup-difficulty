import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-md items-center px-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-bold tracking-tight"
        >
          <Image
            src="/head-icon.png"
            alt="FIFA WC 2026 Analyzer Logo"
            width={16}
            height={16}
            className="shrink-0"
          />
          <div className="flex items-baseline gap-1">
            <span className="text-primary">World Cup </span>
            <span className="text-muted-foreground">Path Difficulty Analyzer</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
