import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-md items-center px-5">
        <Link
          href="/"
          className="text-sm font-bold tracking-tight"
        >
          <span className="text-primary">World Cup</span>{" "}
          <span className="text-muted-foreground">Path Difficulty Analyzer</span>
        </Link>
      </div>
    </header>
  );
}
