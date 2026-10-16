import { Search } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader, EmptyState, RequestStatusBadge } from "@/components/admin/AdminUi";
import { listAdminRequests, listArtists } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth";
import { formatStudioDateTime, formatTattooSize } from "@/lib/booking/format";
import { REQUEST_STATUSES, REQUEST_STATUS_META } from "@/lib/booking/statuses";
import { TATTOO_STYLES } from "@/types/portfolio";

export const dynamic = "force-dynamic";

export default async function RequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const filters = { status: typeof params.estado === "string" ? params.estado : undefined, query: typeof params.buscar === "string" ? params.buscar : undefined, artist: typeof params.tatuador === "string" ? params.tatuador : undefined, style: typeof params.estilo === "string" ? params.estilo : undefined, deposit: typeof params.anticipo === "string" ? params.anticipo : undefined };
  const [requests, artists] = await Promise.all([listAdminRequests(filters), listArtists()]);
  return <div className="admin-workspace"><AdminPageHeader eyebrow="Solicitudes" title="Bandeja de trabajo" description="Busca por cliente o folio, filtra el flujo y abre cada solicitud para cotizar, proponer horarios o dar seguimiento." />
    <form className="ops-filters" action="/admin/solicitudes" method="get"><label className="ops-search"><Search aria-hidden="true" /><span className="sr-only">Buscar</span><input name="buscar" defaultValue={filters.query} placeholder="Nombre, correo, teléfono o folio" /></label><label><span>Estado</span><select name="estado" defaultValue={filters.status ?? "ALL"}><option value="ALL">Todos</option>{REQUEST_STATUSES.map((status) => <option key={status} value={status}>{REQUEST_STATUS_META[status].label}</option>)}</select></label><label><span>Tatuador</span><select name="tatuador" defaultValue={filters.artist ?? ""}><option value="">Todos</option>{artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label><label><span>Estilo</span><select name="estilo" defaultValue={filters.style ?? ""}><option value="">Todos</option>{TATTOO_STYLES.map((style) => <option key={style}>{style}</option>)}</select></label><button className="button button-secondary" type="submit">Aplicar filtros</button></form>
    {requests.length ? <div className="ops-table-scroll"><table className="ops-table ops-requests-table"><thead><tr><th>Folio / cliente</th><th>Solicitud</th><th>Zona</th><th>Tatuador</th><th>Estado</th><th>Última interacción</th><th>Próxima acción</th></tr></thead><tbody>{requests.map((item) => <tr key={item.id}><td><Link href={`/admin/solicitudes/${item.id}`}><strong>{item.clientName}</strong><small>{item.folio}<br />{item.whatsapp}</small></Link></td><td><span className="ops-clamp">{item.idea}</span><small>{item.style || item.colorPreference}</small></td><td>{item.bodyPlacement}<small>{formatTattooSize(item.approximateSize)}</small></td><td>{item.artistName}</td><td><RequestStatusBadge status={item.status} />{item.depositStatus && <small>Pago: {item.depositStatus}</small>}</td><td>{formatStudioDateTime(item.lastInteractionAt)}</td><td><Link className="ops-next-action" href={`/admin/solicitudes/${item.id}`}>{item.nextAction || "Revisar"}</Link></td></tr>)}</tbody></table></div> : <EmptyState title="No encontramos solicitudes" description="Prueba retirando filtros o espera a que llegue una nueva solicitud desde el sitio público." href="/admin/solicitudes" action="Limpiar filtros" />}
  </div>;
}
