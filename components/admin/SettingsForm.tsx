"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";

interface Settings { defaultDurationMinutes: number; bufferMinutes: number; depositType: string; depositValue: number; paymentInstructions: string; transferBank: string; transferBeneficiary: string; transferClabe: string; transferAccount: string; acceptedPaymentMethods: string[]; notificationSettings: Record<string, boolean> }

export function SettingsForm({ settings }: { settings: Settings }) {
  const [busy, setBusy] = useState(false); const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFeedback(null); const data = new FormData(event.currentTarget);
    const body = {
      defaultDurationMinutes: Number(data.get("defaultDurationMinutes")), bufferMinutes: Number(data.get("bufferMinutes")), depositDueHours: 2, holdHours: 2,
      depositType: data.get("depositType"), depositValue: Math.round(Number(data.get("depositValue")) * (data.get("depositType") === "FIXED" ? 100 : 1)),
      paymentInstructions: data.get("paymentInstructions"), transferBank: data.get("transferBank"), transferBeneficiary: data.get("transferBeneficiary"), transferClabe: String(data.get("transferClabe") || "").replace(/\D/g, ""), transferAccount: String(data.get("transferAccount") || "").replace(/\D/g, ""),
      acceptedPaymentMethods: String(data.get("acceptedPaymentMethods") || "").split(",").map((item) => item.trim()).filter(Boolean),
      notificationSettings: { requestReceived: data.get("requestReceived") === "on", quoteSent: data.get("quoteSent") === "on", depositConfirmed: data.get("depositConfirmed") === "on", appointmentConfirmed: data.get("appointmentConfirmed") === "on", reminder48h: data.get("reminder48h") === "on", reminder24h: data.get("reminder24h") === "on", completed: data.get("completed") === "on" },
    };
    const response = await fetch("/api/admin/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); const result = await response.json().catch(() => ({}));
    setBusy(false); setFeedback({ ok: response.ok, text: response.ok ? "Configuración guardada." : result.error ?? "No se pudo guardar." });
  }
  return <form className="settings-form" onSubmit={submit}>
    {feedback && <div className={feedback.ok ? "ops-feedback success" : "ops-feedback error"}>{feedback.text}</div>}
    <section className="ops-panel"><div className="ops-panel-head"><div><p className="eyebrow">Agenda automática</p><h2>Duración de las citas</h2></div></div><p className="ops-help">Todos los días están disponibles de forma predeterminada. Solo se ocultan horarios con una cita activa o un bloqueo especial.</p><div className="ops-form-grid"><label><span>Duración predeterminada (min)</span><input name="defaultDurationMinutes" type="number" min="30" step="30" defaultValue={settings.defaultDurationMinutes} /></label><label><span>Tiempo entre citas (min)</span><input name="bufferMinutes" type="number" min="0" step="15" defaultValue={settings.bufferMinutes} /></label><div className="span-2 ops-help">El anticipo debe validarse dentro de las 2 horas posteriores al envío de la cotización.</div></div></section>
    <section className="ops-panel"><div className="ops-panel-head"><div><p className="eyebrow">Pagos</p><h2>Datos para transferencia</h2></div></div><div className="ops-form-grid">
      <label><span>Banco</span><input name="transferBank" defaultValue={settings.transferBank} placeholder="Ej. BBVA" /></label><label><span>Beneficiario</span><input name="transferBeneficiary" defaultValue={settings.transferBeneficiary} /></label>
      <label><span>CLABE interbancaria (18 dígitos)</span><input name="transferClabe" type="text" inputMode="numeric" pattern="[0-9]{18}" minLength={18} maxLength={18} title="La CLABE debe contener exactamente 18 dígitos." placeholder="18 dígitos" defaultValue={settings.transferClabe} onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 18); }} /></label><label><span>Número de cuenta o tarjeta (16 dígitos)</span><input name="transferAccount" type="text" inputMode="numeric" pattern="[0-9]{16}" minLength={16} maxLength={16} title="El número de cuenta o tarjeta debe contener exactamente 16 dígitos." placeholder="16 dígitos" defaultValue={settings.transferAccount} onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 16); }} /></label>
      <label><span>Tipo de anticipo</span><select name="depositType" defaultValue={settings.depositType}><option value="FIXED">Monto fijo</option><option value="PERCENTAGE">Porcentaje</option></select></label><label><span>Valor (MXN o %)</span><input name="depositValue" type="number" min="0" defaultValue={settings.depositType === "FIXED" ? settings.depositValue / 100 : settings.depositValue} /></label>
      <label className="span-2"><span>Métodos aceptados separados por coma</span><input name="acceptedPaymentMethods" defaultValue={settings.acceptedPaymentMethods.join(", ")} /></label><label className="span-2"><span>Instrucciones adicionales</span><textarea name="paymentInstructions" defaultValue={settings.paymentInstructions} placeholder="Incluye la referencia que debe usar el cliente o cualquier indicación importante." /></label>
    </div></section>
    <section className="ops-panel"><div className="ops-panel-head"><div><p className="eyebrow">Automatizaciones</p><h2>Correos automáticos</h2></div></div><div className="settings-checks">{[["requestReceived", "Solicitud recibida"], ["quoteSent", "Cotización enviada"], ["depositConfirmed", "Anticipo confirmado"], ["appointmentConfirmed", "Cita confirmada"], ["reminder48h", "Recordatorio 48 horas"], ["reminder24h", "Recordatorio 24 horas"], ["completed", "Agradecimiento al completar"]].map(([name, label]) => <label key={name}><input name={name} type="checkbox" defaultChecked={settings.notificationSettings[name] ?? true} />{label}</label>)}</div></section>
    <button className="button button-primary settings-save" disabled={busy}>{busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <Save aria-hidden="true" />}Guardar configuración</button>
  </form>;
}
