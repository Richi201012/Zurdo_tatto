"use client";

import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, CreditCard, FileText, LayoutDashboard, LogOut, Mail, Menu, Palette, Settings, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import type { AdminRole } from "@/lib/booking/statuses";

const nav = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/admin/solicitudes", label: "Solicitudes", icon: FileText },
  { href: "/admin/citas", label: "Citas", icon: CalendarDays },
  { href: "/admin/calendario", label: "Calendario", icon: CalendarRange },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/pagos", label: "Pagos", icon: CreditCard },
  { href: "/admin/disponibilidad", label: "Disponibilidad", icon: CalendarRange },
  { href: "/admin/trabajos", label: "Portafolio", icon: Palette },
  { href: "/admin/configuracion/correos", label: "Notificaciones", icon: Mail },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings, adminOnly: true },
];

export function AdminShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string; role: AdminRole } }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const visibleNav = nav.filter((item) => !item.adminOnly || user.role === "ADMIN");
  return <div className={collapsed ? "admin-app nav-collapsed" : "admin-app"}>
    <aside className={mobileOpen ? "admin-sidebar open" : "admin-sidebar"} aria-label="Navegación administrativa">
      <div className="admin-sidebar-head"><Logo href="/admin" /><button className="admin-mobile-close" type="button" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)}><X aria-hidden="true" /></button></div>
      <nav>{visibleNav.map(({ href, label, icon: Icon, exact }) => { const active = exact ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined} onClick={() => setMobileOpen(false)}><Icon aria-hidden="true" /><span>{label}</span></Link>; })}</nav>
      <div className="admin-sidebar-footer"><div className="admin-user"><span>{user.name}</span><small>{user.role}</small></div><form action="/api/admin/logout" method="post"><button type="submit" aria-label="Cerrar sesión"><LogOut aria-hidden="true" /><span>Salir</span></button></form></div>
      <button className="admin-collapse" type="button" aria-label={collapsed ? "Expandir navegación" : "Contraer navegación"} onClick={() => setCollapsed((value) => !value)}>{collapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}</button>
    </aside>
    {mobileOpen && <button className="admin-sidebar-scrim" type="button" aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} />}
    <div className="admin-main-shell"><header className="admin-topbar"><button className="admin-menu-button" type="button" aria-label="Abrir menú" onClick={() => setMobileOpen(true)}><Menu aria-hidden="true" /></button><div><span>Centro de operaciones</span><small>{user.email}</small></div><Link href="/" target="_blank">Ver sitio</Link></header><main id="contenido" className="admin-content">{children}</main></div>
  </div>;
}

