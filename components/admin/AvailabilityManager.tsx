"use client";

import { CalendarOff, LoaderCircle, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Artist { id: string; name: string }

export function AvailabilityManager({ artists, isAdmin }: { artists: Artist[]; isAdmin: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState(""); const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  async function submit(type: string, form: HTMLFormElement, body: Record<string, unknown>) {
    setBusy(type); setFeedback(null);
    const response = await fetch("/api/admin/availability", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, ...body }) }); const result = await response.json().catch(() => ({}));
    setBusy(""); setFeedback({ ok: response.ok, text: response.ok ? "Configuración guardada." : result.error ?? "No se pudo guardar." }); if (response.ok) { form.reset(); router.refresh(); }
  }
  return <div className="availability-admin-forms">
    {feedback && <div className={feedback.ok ? "ops-feedback success" : "ops-feedback error"} role={feedback.ok ? "status" : "alert"}>{feedback.text}</div>}
    {isAdmin && <section className="ops-panel"><div className="ops-panel-head"><div><p className="eyebrow">Equipo</p><h2>Agregar tatuador</h2></div><UserPlus aria-hidden="true" /></div><p className="ops-help">Cada tatuador activo recibe disponibilidad automática todos los días.</p><form className="ops-inline-form" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; submit("ARTIST", form, { name: new FormData(form).get("name") }); }}><label className="sr-only" htmlFor="artist-name">Nombre</label><input id="artist-name" name="name" placeholder="Nombre del tatuador" required /><button className="button button-secondary" disabled={Boolean(busy)}>{busy === "ARTIST" && <LoaderCircle className="spin" />}Agregar</button></form></section>}
    {artists.length > 0 && <section className="ops-panel"><div className="ops-panel-head"><div><p className="eyebrow">Excepciones</p><h2>Bloquear una fecha</h2></div><CalendarOff aria-hidden="true" /></div><p className="ops-help">Úsalo solamente para vacaciones, eventos o periodos que realmente no deban ofrecerse.</p><form className="ops-form-grid" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); submit("EXCEPTION", form, { artistId: data.get("artistId"), date: data.get("date"), startTime: data.get("startTime"), endTime: data.get("endTime"), kind: data.get("kind"), reason: data.get("reason") }); }}><label><span>Tatuador</span><select name="artistId" required>{artists.map((artist) => <option value={artist.id} key={artist.id}>{artist.name}</option>)}</select></label><label><span>Tipo</span><select name="kind"><option value="BLOCKED">Bloqueo</option><option value="VACATION">Vacaciones</option><option value="PERSONAL">Día personal</option><option value="EVENT">Evento</option><option value="SPECIAL_HOURS">Horario especial</option></select></label><label><span>Fecha</span><input name="date" type="date" required /></label><label><span>Inicio opcional</span><input name="startTime" type="time" /></label><label><span>Fin opcional</span><input name="endTime" type="time" /></label><label className="span-2"><span>Motivo</span><input name="reason" required /></label><button className="button button-primary span-2" disabled={Boolean(busy)}>Guardar bloqueo</button></form></section>}
  </div>;
}
