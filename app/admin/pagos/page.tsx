import Link from "next/link";
import { AdminPageHeader, EmptyState } from "@/components/admin/AdminUi";
import { PaymentConfirmButton } from "@/components/admin/PaymentConfirmButton";
import { listPayments } from "@/lib/admin/data";
import { requireRole } from "@/lib/auth";
import { formatMoney, formatStudioDateTime } from "@/lib/booking/format";
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from "@/lib/booking/statuses";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  await requireRole(["ADMIN", "RECEPTION"]); const rows = await listPayments();
  return <div className="admin-workspace"><AdminPageHeader eyebrow="Finanzas" title="Anticipos y pagos" description="Cada confirmación genera un movimiento inmutable; los montos anteriores nunca se sobrescriben sin historial." />{rows.length ? <div className="ops-table-scroll"><table className="ops-table"><thead><tr><th>Solicitud</th><th>Total estimado</th><th>Anticipo</th><th>Pagado</th><th>Estado</th><th>Referencia</th><th>Actualización</th><th>Acción</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><Link href={`/admin/solicitudes/${row.requestId}`}><strong>{row.clientName}</strong><small>{row.requestFolio}</small></Link></td><td>{formatMoney(row.totalCents)}</td><td>{formatMoney(row.depositRequiredCents)}</td><td>{formatMoney(row.paidCents)}</td><td><span className={`ops-status ${row.status === "PAID" ? "success" : row.status === "FAILED" ? "danger" : "warning"}`}>{PAYMENT_STATUS_LABELS[row.status as PaymentStatus] ?? row.status}</span></td><td>{row.reference || "—"}<small>{row.method}</small></td><td>{formatStudioDateTime(row.updatedAt)}</td><td><PaymentConfirmButton paymentId={row.id} amountCents={Math.max(1, row.depositRequiredCents - row.paidCents)} disabled={row.status === "PAID"} /></td></tr>)}</tbody></table></div> : <EmptyState title="No hay pagos registrados" description="Los anticipos aparecerán cuando se guarde una cotización para una solicitud." href="/admin/solicitudes" action="Abrir solicitudes" />}</div>;
}

