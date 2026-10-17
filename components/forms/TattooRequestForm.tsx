"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarCheck2, Check, ImagePlus, LoaderCircle, RefreshCw, ShieldCheck, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatStudioDate, formatTattooSize } from "@/lib/booking/format";
import type { TattooRequestData } from "@/types/request";

const steps = ["Tus datos", "Tu tatuaje", "Referencias", "Día preferido", "Confirmación"];
const initialData: TattooRequestData = { name: "", whatsapp: "", email: "", idea: "", bodyPlacement: "", approximateSize: "", colorPreference: "", preferredDay: "", preferredTime: "Por asignar por el tatuador", termsVersion: "", referencePortfolioItemId: "" };

interface AvailabilityPayload { availableDates: string[]; terms: string[]; termsVersion: string }

function monthDays(key: string) {
  const [year, month] = key.split("-").map(Number);
  return { year, month, count: new Date(Date.UTC(year, month, 0)).getUTCDate(), firstWeekday: (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7 };
}

export function TattooRequestForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initialData);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [serverError, setServerError] = useState("");
  const [availability, setAvailability] = useState<AvailabilityPayload | null>(null);
  const [availabilityState, setAvailabilityState] = useState<"idle" | "loading" | "error">("idle");
  const [availabilityError, setAvailabilityError] = useState("");
  const [activeDate, setActiveDate] = useState("");
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const errorSummary = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);
  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get("referencia");
    if (reference) setData((value) => ({ ...value, referencePortfolioItemId: reference }));
  }, []);
  useEffect(() => {
    if (!termsOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && status !== "submitting") setTermsOpen(false); };
    document.body.classList.add("modal-open");
    document.addEventListener("keydown", close);
    closeButtonRef.current?.focus();
    return () => { document.body.classList.remove("modal-open"); document.removeEventListener("keydown", close); };
  }, [termsOpen, status]);
  useEffect(() => { if (step === 3 && !availability && availabilityState === "idle") void loadAvailability(); }, [step, availability, availabilityState]);

  function update(field: keyof TattooRequestData, value: string) {
    setData((current) => ({ ...current, [field]: value }));
    setErrors((current) => { const next = { ...current }; delete next[field]; return next; });
  }

  async function loadAvailability(refresh = false) {
    setAvailabilityState("loading"); setAvailabilityError("");
    try {
      const response = await fetch("/api/availability", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "No se pudo consultar la disponibilidad.");
      setAvailability(body);
      setData((current) => ({ ...current, termsVersion: body.termsVersion, ...(refresh ? { preferredDay: "", preferredTime: "Por asignar por el tatuador" } : {}) }));
      setActiveDate("");
      setAvailabilityState("idle");
    } catch (error) {
      setAvailabilityState("error"); setAvailabilityError(error instanceof Error ? error.message : "No se pudo consultar la disponibilidad.");
    }
  }

  function chooseDate(day: string) {
    setActiveDate(day);
    setData((current) => ({ ...current, preferredDay: day, preferredTime: "Por asignar por el tatuador", termsVersion: availability?.termsVersion ?? current.termsVersion }));
    setErrors((current) => { const next = { ...current }; delete next.preferredDay; return next; });
  }

  function validateStep() {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (data.name.trim().length < 2) next.name = "Escribe tu nombre.";
      if (data.whatsapp.trim().length < 7) next.whatsapp = "Escribe un WhatsApp válido.";
      if (!/^\S+@\S+\.\S+$/.test(data.email)) next.email = "Escribe un correo válido.";
    }
    if (step === 1) {
      if (data.idea.trim().length < 15) next.idea = "Cuéntanos un poco más sobre tu idea.";
      if (!data.bodyPlacement) next.bodyPlacement = "Indica la zona del cuerpo.";
      if (!data.approximateSize) next.approximateSize = "Indica un tamaño aproximado.";
      if (!data.colorPreference) next.colorPreference = "Elige una preferencia.";
    }
    if (step === 3 && !data.preferredDay) next.preferredDay = "Elige el día que prefieres.";
    setErrors(next);
    if (Object.keys(next).length) requestAnimationFrame(() => errorSummary.current?.focus());
    return Object.keys(next).length === 0;
  }

  function next() { if (validateStep()) setStep((value) => Math.min(4, value + 1)); }
  function back() { setErrors({}); setStep((value) => Math.max(0, value - 1)); }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const accepted = Array.from(list).filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type));
    setFiles((current) => [...current, ...accepted].slice(0, 6));
  }

  async function submit() {
    if (!termsAccepted || !data.preferredDay) return;
    setStatus("submitting"); setProgress(0); setServerError("");
    const body = new FormData();
    Object.entries(data).forEach(([key, value]) => { if (value) body.append(key, value); });
    files.forEach((file) => body.append("images", file));
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/requests");
        xhr.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100)); };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(JSON.parse(xhr.responseText || "{}").error || "No se pudo enviar."));
        xhr.onerror = () => reject(new Error("No se pudo conectar. Intenta de nuevo."));
        xhr.send(body);
      });
      setTermsOpen(false); setStatus("success");
    } catch (error) {
      setStatus("error"); setServerError(error instanceof Error ? error.message : "No se pudo enviar la solicitud.");
    }
  }

  if (status === "success") return <div className="success-state" role="status"><Check size={40} aria-hidden="true" /><p className="eyebrow">Solicitud recibida</p><h3>Gracias, {data.name}.</h3><p className="lede">Registramos el día que prefieres. El tatuador revisará tu proyecto y te enviaremos la cotización con la fecha y hora propuestas.</p><div className="pending-notice"><ShieldCheck aria-hidden="true" /><span>Cuando recibas la cotización tendrás <strong>2 horas</strong> para realizar el anticipo.</span></div><button className="button button-secondary" type="button" onClick={() => { setData(initialData); setFiles([]); setStep(0); setStatus("idle"); setAvailability(null); setAvailabilityState("idle"); }}>Enviar otra solicitud</button></div>;

  return <div className="wizard">
    <div className="wizard-progress" aria-label={`Paso ${step + 1} de ${steps.length}`}>{steps.map((item, index) => <span key={item} className={index <= step ? "active" : ""} />)}</div>
    {Object.keys(errors).length > 0 && <div ref={errorSummary} role="alert" tabIndex={-1}><strong>Revisa los campos señalados antes de continuar.</strong></div>}
    <AnimatePresence mode="wait" initial={false}><motion.div key={step} initial={reduceMotion ? false : { opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -16 }} transition={{ duration: .22 }}>
      <p className="wizard-step-label">Paso {step + 1} de {steps.length}</p><h3>{steps[step]}</h3>
      {step === 0 && <div className="form-grid"><Field id="name" label="Nombre" error={errors.name}><input id="name" autoComplete="name" aria-invalid={Boolean(errors.name)} value={data.name} onChange={(e) => update("name", e.target.value)} /></Field><Field id="whatsapp" label="WhatsApp" error={errors.whatsapp}><input id="whatsapp" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.whatsapp)} value={data.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} /></Field><Field id="email" label="Correo" error={errors.email} full><input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} value={data.email} onChange={(e) => update("email", e.target.value)} /></Field></div>}
      {step === 1 && <div className="form-grid"><Field id="idea" label="Idea o descripción" error={errors.idea} full><textarea id="idea" aria-invalid={Boolean(errors.idea)} value={data.idea} onChange={(e) => update("idea", e.target.value)} placeholder="Cuéntanos qué quieres representar, el estilo y cualquier detalle importante." /></Field><Field id="bodyPlacement" label="Zona del cuerpo" error={errors.bodyPlacement}><input id="bodyPlacement" aria-invalid={Boolean(errors.bodyPlacement)} value={data.bodyPlacement} onChange={(e) => update("bodyPlacement", e.target.value)} /></Field><Field id="approximateSize" label="Tamaño aproximado (cm)" error={errors.approximateSize}><input id="approximateSize" aria-invalid={Boolean(errors.approximateSize)} value={data.approximateSize} onChange={(e) => update("approximateSize", e.target.value)} placeholder="Ej. 12 × 8" /></Field><fieldset className="fieldset"><legend>Color o blanco y negro</legend><div className="radio-row">{["Color", "Blanco y negro", "Aún no lo sé"].map((option) => <label className="radio-option" key={option}><input type="radio" name="color" value={option} checked={data.colorPreference === option} onChange={(e) => update("colorPreference", e.target.value)} />{option}</label>)}</div>{errors.colorPreference && <p className="field-error" role="alert">{errors.colorPreference}</p>}</fieldset></div>}
      {step === 2 && <div><label className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}><input type="file" hidden multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => addFiles(e.target.files)} /><span><ImagePlus size={30} aria-hidden="true" /><strong>Agregar referencias</strong><br /><span className="muted">Arrastra o selecciona JPG, PNG o WEBP · hasta 6 archivos</span></span></label>{files.length > 0 && <div className="preview-grid">{previews.map((preview, index) => <div className="preview" key={`${preview.file.name}-${index}`}><Image src={preview.url} alt={`Vista previa ${index + 1}`} fill unoptimized /><button className="icon-button" type="button" aria-label={`Eliminar ${preview.file.name}`} onClick={() => setFiles((items) => items.filter((_, fileIndex) => fileIndex !== index))}><X size={18} aria-hidden="true" /></button></div>)}</div>}</div>}
      {step === 3 && <PublicAvailabilityCalendar payload={availability} state={availabilityState} error={availabilityError} activeDate={activeDate} onSelect={chooseDate} onRetry={() => void loadAvailability(true)} />}
      {step === 3 && errors.preferredDay && <p className="field-error booking-step-error" role="alert">{errors.preferredDay}</p>}
      {step === 4 && <><dl className="summary"><Summary label="Nombre" value={data.name} /><Summary label="Contacto" value={`${data.whatsapp} · ${data.email}`} /><Summary label="Idea" value={data.idea} /><Summary label="Zona y tamaño" value={`${data.bodyPlacement} · ${formatTattooSize(data.approximateSize)}`} /><Summary label="Día preferido" value={data.preferredDay ? formatStudioDate(`${data.preferredDay}T12:00:00-06:00`, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Sin elegir"} /><Summary label="Hora" value="La asignará el tatuador" /><Summary label="Referencias" value={`${files.length} archivo(s)${data.referencePortfolioItemId ? " + trabajo del portafolio" : ""}`} /></dl><p className="booking-review-note">El tatuador confirmará la hora en la cotización. Antes de enviar podrás revisar las condiciones del anticipo y cambios de fecha.</p>{status === "error" && <p className="field-error" role="alert">{serverError}</p>}</>}
    </motion.div></AnimatePresence>
    <div className="wizard-actions"><button className="button button-secondary" type="button" onClick={back} disabled={step === 0 || status === "submitting"}><ArrowLeft size={17} aria-hidden="true" /> Atrás</button>{step < 4 ? <button className="button button-primary" type="button" onClick={next} disabled={step === 3 && (availabilityState === "loading" || !availability?.availableDates.length)}>Continuar <ArrowRight size={17} aria-hidden="true" /></button> : <button className="button button-primary" type="button" disabled={status === "submitting" || !data.preferredDay} onClick={() => { setTermsAccepted(false); setServerError(""); setTermsOpen(true); }}>Finalizar solicitud <ArrowRight size={17} aria-hidden="true" /></button>}</div>
    {termsOpen && data.preferredDay && availability && <div className="booking-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && status !== "submitting") setTermsOpen(false); }}><section className="booking-terms-modal" role="dialog" aria-modal="true" aria-labelledby="request-terms-title"><button ref={closeButtonRef} className="booking-modal-close" type="button" aria-label="Cerrar" disabled={status === "submitting"} onClick={() => setTermsOpen(false)}><X aria-hidden="true" /></button><p className="eyebrow">Último paso</p><h2 id="request-terms-title">Revisaremos tu proyecto</h2><p>Este día es una <strong>preferencia</strong>. La hora propuesta aparecerá en la cotización después de revisar tu proyecto.</p><div className="booking-modal-summary"><div><span>Día preferido</span><strong>{formatStudioDate(`${data.preferredDay}T12:00:00-06:00`, { weekday: "long", day: "numeric", month: "long" })}</strong></div><div><span>Horario</span><strong>Lo asignará el tatuador</strong></div><div><span>Anticipo</span><strong>Se indicará en la cotización</strong></div></div><div className="booking-terms"><h3>Cambios y cancelaciones</h3><ul>{availability.terms.map((term) => <li key={term}>{term}</li>)}</ul></div><label className="booking-terms-check"><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} /><span>Leí y acepto las condiciones de anticipo, cambios de fecha y cancelaciones.</span></label>{status === "error" && <p className="field-error" role="alert">{serverError}</p>}<div className="booking-modal-actions"><button className="button button-secondary" type="button" disabled={status === "submitting"} onClick={() => setTermsOpen(false)}>Volver</button><button className="button button-primary" type="button" disabled={!termsAccepted || status === "submitting"} onClick={submit}>{status === "submitting" ? <><LoaderCircle className="spin" aria-hidden="true" /> Enviando {progress}%</> : <><ShieldCheck aria-hidden="true" />Aceptar y enviar</>}</button></div></section></div>}
  </div>;
}

function PublicAvailabilityCalendar({ payload, state, error, activeDate, onSelect, onRetry }: { payload: AvailabilityPayload | null; state: "idle" | "loading" | "error"; error: string; activeDate: string; onSelect: (value: string) => void; onRetry: () => void }) {
  const available = useMemo(() => new Set(payload?.availableDates ?? []), [payload]);
  const months = useMemo(() => Array.from(new Set((payload?.availableDates ?? []).map((key) => key.slice(0, 7)))).sort(), [payload]);
  if (state === "loading") return <div className="booking-loading" role="status"><LoaderCircle className="spin" aria-hidden="true" /><strong>Consultando días disponibles…</strong><span>Comprobamos la agenda general del estudio.</span></div>;
  if (state === "error") return <div className="booking-empty" role="alert"><p>{error}</p><button className="button button-secondary" type="button" onClick={onRetry}><RefreshCw aria-hidden="true" />Intentar de nuevo</button></div>;
  if (!payload?.availableDates.length) return <div className="booking-empty"><CalendarCheck2 aria-hidden="true" /><strong>No hay días disponibles por ahora</strong><p>Actualiza el calendario para consultar nuevamente.</p><button className="button button-secondary" type="button" onClick={onRetry}><RefreshCw aria-hidden="true" />Actualizar calendario</button></div>;
  return <div className="availability-selector public-request-calendar"><p className="booking-review-note">Elige únicamente el día que prefieres. Después de revisar tu proyecto, el tatuador definirá la hora exacta.</p><div className="client-calendar-legend" aria-label="Leyenda del calendario"><span><i className="available" />Disponible</span><span><i className="unavailable" />No disponible</span><span><i className="selected" />Día elegido</span></div><div className="client-calendar-stack">{months.map((key) => { const calendar = monthDays(key); return <section className="client-calendar" key={key}><h2>{new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(calendar.year, calendar.month - 1, 1)))}</h2><div className="client-calendar-grid" role="group" aria-label={`Disponibilidad de ${key}`}><div className="client-weekdays" aria-hidden="true">{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => <span key={day}>{day}</span>)}</div>{Array.from({ length: calendar.firstWeekday }).map((_, index) => <span className="calendar-spacer" key={`spacer-${index}`} />)}{Array.from({ length: calendar.count }, (_, index) => { const day = index + 1; const dayKey = `${key}-${String(day).padStart(2, "0")}`; const isAvailable = available.has(dayKey); const active = activeDate === dayKey; return <button key={dayKey} type="button" aria-pressed={active} aria-label={`${day} de ${key}: ${isAvailable ? "disponible" : "no disponible"}`} disabled={!isAvailable} className={`${isAvailable ? "available" : "unavailable"}${active ? " active" : ""}`} onClick={() => onSelect(dayKey)}><span>{day}</span>{isAvailable && <small>Disponible</small>}</button>; })}</div></section>; })}</div><p className="availability-expiry">Elegir un día no confirma una cita. La reservación quedará asegurada cuando validemos tu anticipo.</p></div>;
}

function Field({ id, label, error, full, children }: { id: string; label: string; error?: string; full?: boolean; children: React.ReactNode }) { return <div className={`field${full ? " full" : ""}`}><label htmlFor={id}>{label}</label>{children}{error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}</div>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="summary-row"><dt>{label}</dt><dd>{value}</dd></div>; }
