import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

// This app always reads live data from SQLite; nothing here should be
// statically prerendered at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TPRM | Third-Party Risk Management",
  description: "Vendor inventory, assessments, findings, and risk reporting.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 print:bg-white">
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 print:max-w-none print:px-0 print:py-0">
          {children}
        </main>
      </body>
    </html>
  );
}
