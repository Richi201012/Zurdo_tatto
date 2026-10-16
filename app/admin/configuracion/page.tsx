import { eq } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { studioConfig } from "@/config/studio";
import { getDatabase } from "@/db";
import { studioSettings } from "@/db/schema";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireRole(["ADMIN"]); const [settings] = await getDatabase().select().from(studioSettings).where(eq(studioSettings.id, "default")).limit(1);
  const value = settings ?? { defaultDurationMinutes: 120, bufferMinutes: 30, depositDueHours: 2, holdHours: 2, depositType: "FIXED", depositValue: 50000, paymentInstructions: "", transferBank: "", transferBeneficiary: "", transferClabe: "", transferAccount: "", acceptedPaymentMethods: [], notificationSettings: {} };
  return <div className="admin-workspace"><AdminPageHeader eyebrow="Sistema" title="Configuración" description="Parámetros operativos del estudio. Las credenciales y claves secretas permanecen únicamente en variables de entorno." /><section className="ops-panel studio-config-summary"><div><p className="eyebrow">Identidad centralizada</p><h2>{studioConfig.name}</h2><p>{studioConfig.contact.email || "Correo pendiente"} · {studioConfig.contact.phone || "Teléfono pendiente"}</p><p>{studioConfig.contact.address || "Dirección pendiente"}</p></div><code>config/studio.ts</code></section><SettingsForm settings={value} /></div>;
}

