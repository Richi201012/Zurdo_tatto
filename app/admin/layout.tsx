import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { currentAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Administración", robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await currentAdmin();
  return session ? <AdminShell user={session}>{children}</AdminShell> : children;
}
