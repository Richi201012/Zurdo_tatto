"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="admin-workspace"><div className="ops-error-state" role="alert"><AlertTriangle aria-hidden="true" /><p className="eyebrow">No pudimos cargar esta sección</p><h1>Algo salió mal.</h1><p>La información no fue modificada. Intenta cargar de nuevo; si el problema continúa, revisa la conexión con PostgreSQL.</p><button className="button button-primary" type="button" onClick={reset}><RotateCcw aria-hidden="true" />Reintentar</button></div></div>;
}

