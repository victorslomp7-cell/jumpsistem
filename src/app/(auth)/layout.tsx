export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="jump-dark" className="flex min-h-screen flex-col bg-background text-foreground">
      {children}
    </div>
  );
}
