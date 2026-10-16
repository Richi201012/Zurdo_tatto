"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PaymentConfirmButton({ paymentId, amountCents, disabled }: { paymentId: string; amountCents: number; disabled?: boolean }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const router = useRouter();
  async function confirm() {
    if (!window.confirm("Confirma únicamente después de validar el pago. Se creará un movimiento financiero y una auditoría.")) return;
    const reference = window.prompt("Referencia de pago (opcional)") ?? "";
    setBusy(true); setError("");
    const response = await fetch(`/api/admin/payments/${paymentId}/confirm`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision: "APPROVE", amountCents, paymentMethod: "Transferencia", externalReference: reference, idempotencyKey: `payment-list-${paymentId}-${reference || amountCents}` }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setError(body.error ?? "No se pudo confirmar."); setBusy(false); return; }
    router.refresh();
  }
  return <div>{error && <small className="field-error">{error}</small>}<button className="ops-row-button" type="button" disabled={busy || disabled} onClick={confirm}>{busy ? <LoaderCircle className="spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}{disabled ? "Confirmado" : "Confirmar"}</button></div>;
}

