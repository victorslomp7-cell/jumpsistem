import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col pb-16 md:pb-0">
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
