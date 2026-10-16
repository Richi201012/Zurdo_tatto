import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { Logo } from "@/components/ui/Logo";
import { isAdminConfigured, isAdminRequest } from "@/lib/auth";

export default async function AdminLoginPage() {
  if (await isAdminRequest()) redirect("/admin");
  const configured = isAdminConfigured();
  return <main className="admin-login"><div className="admin-login-panel"><Logo /><p className="eyebrow">Acceso restringido</p><h1>Centro de operaciones.</h1><p className="muted">Solicitudes, citas, anticipos y comunicación del estudio en un solo lugar.</p>{configured ? <AdminLoginForm /> : <div className="admin-setup" role="status"><strong>Configuración pendiente</strong><p>Define `ADMIN_EMAIL`, `ADMIN_PASSWORD` y un `ADMIN_SESSION_SECRET` de al menos 24 caracteres en `.env.local`.</p></div>}<a href="/" className="admin-back">← Volver al sitio</a></div></main>;
}
