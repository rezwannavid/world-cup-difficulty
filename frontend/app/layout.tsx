import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "World Cup Path Difficulty",
  description: "Analyze tournament paths using PSI and RDS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gray-50 text-black flex flex-col">
        
        {/* Navbar */}
        <nav className="w-full border-b bg-white px-8 py-4 flex items-center justify-between shadow-sm">
          <Link href="/" className="text-xl font-bold">
            World Cup Difficulty
          </Link>

          <div className="flex gap-6 text-sm font-medium">
            <Link href="/" className="hover:opacity-70 transition">
              Home
            </Link>

            <Link href="/rankings" className="hover:opacity-70 transition">
              Rankings
            </Link>

            <Link href="/methodology" className="hover:opacity-70 transition">
              Methodology
            </Link>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1">{children}</main>

      </body>
    </html>
  );
}
