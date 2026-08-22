import Link from "next/link";
import { auth } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold text-slate-900">
              Risk Readiness
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/organizations" className="hover:text-slate-900">
                Organizations
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>{session?.user?.email}</span>
            <form action={logout}>
              <button type="submit" className="text-slate-500 hover:text-slate-900">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
