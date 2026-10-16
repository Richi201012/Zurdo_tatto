"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";

export function AdminLoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? "No se pudo iniciar sesión."); setLoading(false); return; }
    window.location.href = "/admin";
  }
  return <form className="admin-login-form" onSubmit={submit}><div className="field"><label htmlFor="login-email">Correo</label><input id="login-email" name="email" type="email" autoComplete="username" required /></div><div className="field"><label htmlFor="login-password">Contraseña</label><input id="login-password" name="password" type="password" autoComplete="current-password" required /></div>{error && <p className="field-error" role="alert">{error}</p>}<button className="button button-primary" disabled={loading}>{loading && <LoaderCircle className="spin" size={17} aria-hidden="true" />}Entrar</button></form>;
}
