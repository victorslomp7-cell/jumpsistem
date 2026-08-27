import { BrandMark } from "@/components/brand/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="jump-dark"
      className="flex min-h-screen flex-col bg-gradient-to-br from-jump-navy-dark via-jump-navy to-jump-navy-darker text-foreground"
    >
      <header className="px-6 py-6 sm:px-10">
        <BrandMark />
      </header>
      {children}
    </div>
  );
}
