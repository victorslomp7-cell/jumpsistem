import { redirect } from "next/navigation";

export default function RootPage() {
  // Fase 1 vai decidir aqui entre /login e /dashboard conforme sessão.
  redirect("/login");
}
