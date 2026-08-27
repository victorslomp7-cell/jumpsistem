import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TopBar } from "@/components/layout/topbar";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const current = await getCurrentProfile();

  return (
    <div data-theme="jump-dark" className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col pb-16 md:pb-0">
        <TopBar email={current?.email ?? null} profile={current?.profile ?? null} />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
