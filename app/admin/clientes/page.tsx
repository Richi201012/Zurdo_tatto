import Link from "next/link";
import { AdminPageHeader, EmptyState } from "@/components/admin/AdminUi";
import { listClients } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth";
import { formatMoney, formatStudioDateTime } from "@/lib/booking/format";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  await requireAdmin(); const rows = await listClients();
  return <div className="admin-workspace"><AdminPageHeader eyebrow="Relaciones" title="Clientes" description="Una vista consolidada de contacto, solicitudes, citas y pagos sin guardar información sensible innecesaria." />{rows.length ? <div className="ops-table-scroll"><table className="ops-table"><thead><tr><th>Cliente</th><th>Contacto</th><th>Solicitudes</th><th>Citas</th><th>Pagos registrados</th><th>Desde</th><th /></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><Link href={`/admin/clientes/${row.id}`}><strong>{row.name}</strong></Link></td><td><a href={`mailto:${row.email}`}>{row.email}</a><small>{row.whatsapp}</small></td><td>{row.requestCount}</td><td>{row.appointmentCount}</td><td>{formatMoney(row.paidCents)}</td><td>{formatStudioDateTime(row.createdAt)}</td><td><Link className="ops-row-button" href={`/admin/clientes/${row.id}`}>Abrir</Link></td></tr>)}</tbody></table></div> : <EmptyState title="Aún no hay clientes" description="El perfil se crea automáticamente cuando una persona envía su primera solicitud." href="/" action="Ver sitio público" />}</div>;
}
