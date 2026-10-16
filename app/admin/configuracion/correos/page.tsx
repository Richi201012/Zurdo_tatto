import { AdminPageHeader } from "@/components/admin/AdminUi";
import { NotificationHistory } from "@/components/admin/NotificationHistory";
import { listEmailLogs } from "@/lib/admin/data";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NotificationPage() {
  await requireAdmin();
  const logs = await listEmailLogs();

  return (
    <div className="admin-workspace">
      <AdminPageHeader
        eyebrow="Comunicación"
        title="Notificaciones al cliente"
        description="Cada acción importante envía automáticamente el mensaje correcto. Aquí solo revisas si fue procesado o necesitas reintentarlo."
      />
      <NotificationHistory logs={logs} />
    </div>
  );
}
