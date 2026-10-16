"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, ImagePlus, LoaderCircle, LogOut, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { TATTOO_STYLES, type PortfolioItem } from "@/types/portfolio";

export function AdminPortfolioManager({ initialItems, embedded = false }: { initialItems: PortfolioItem[]; embedded?: boolean }) {
  const [items, setItems] = useState(initialItems);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<PortfolioItem | null>(null);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const reduceMotion = useReducedMotion();
  const stats = useMemo(() => ({ published: items.filter((item) => item.isPublished).length, hidden: items.filter((item) => !item.isPublished).length, featured: items.filter((item) => item.isFeatured).length }), [items]);

  async function patch(item: PortfolioItem, changes: Partial<PortfolioItem>) {
    setBusyId(item.id);
    const response = await fetch(`/api/admin/portfolio/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
    const body = await response.json();
    if (response.ok) setItems((current) => current.map((entry) => entry.id === item.id ? body.item : entry)); else setMessage(body.error ?? "No se pudo guardar.");
    setBusyId("");
  }

  async function remove() {
    if (!deleteItem) return;
    setBusyId(deleteItem.id);
    const response = await fetch(`/api/admin/portfolio/${deleteItem.id}`, { method: "DELETE" });
    if (response.ok) { setItems((current) => current.filter((item) => item.id !== deleteItem.id)); setDeleteItem(null); setMessage("Trabajo eliminado. El registro conserva borrado recuperable."); }
    setBusyId("");
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; setItems(next);
    const response = await fetch("/api/admin/portfolio", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: next.map((item) => item.id) }) });
    if (!response.ok) { setItems(items); setMessage("No se pudo cambiar el orden."); }
  }

  return <main className={embedded ? "admin-page admin-page-embedded" : "admin-page"}>
    {!embedded && <header className="admin-header"><Logo href="/admin/trabajos" /><div className="admin-header-actions"><a className="button button-secondary" href="/" target="_blank" rel="noopener noreferrer">Ver sitio</a><form action="/api/admin/logout" method="post"><button className="icon-button" aria-label="Cerrar sesión"><LogOut aria-hidden="true" /></button></form></div></header>}
    <div className="admin-container">
      <div className="admin-title-row"><div><p className="eyebrow">Portafolio</p><h1>Trabajos realizados</h1><p className="muted">Publica desde el teléfono o administra el detalle de cada pieza.</p></div><button className="button button-primary" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={18} aria-hidden="true" />Agregar trabajo</button></div>
      <div className="admin-stats"><div><strong>{stats.published}</strong><span>Publicados</span></div><div><strong>{stats.hidden}</strong><span>Ocultos</span></div><div><strong>{stats.featured}</strong><span>Destacados</span></div></div>
      {message && <div className="admin-message" role="status">{message}<button type="button" aria-label="Cerrar mensaje" onClick={() => setMessage("")}><X size={17} /></button></div>}
      <div className="admin-list">
        {items.map((item, index) => {
          const cover = item.images.find((image) => image.isCover) ?? item.images[0];
          return <article className="admin-work" key={item.id}>
            <div className="admin-work-image"><Image src={cover.thumbnailUrl ?? cover.optimizedUrl ?? cover.imageUrl} alt={cover.alt} fill sizes="120px" /></div>
            <div className="admin-work-copy"><div className="admin-work-title"><h2>{item.title}</h2>{item.isFeatured && <span className="status featured"><Sparkles size={13} aria-hidden="true" />Destacado</span>}{item.isPublished ? <span className="status published">Visible</span> : <span className="status hidden">Oculto</span>}</div><p>{item.style}{item.artist ? ` · ${item.artist}` : ""}</p></div>
            <div className="admin-order" aria-label="Cambiar orden"><GripVertical aria-hidden="true" /><button className="icon-button" type="button" aria-label="Mover arriba" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={17} /></button><button className="icon-button" type="button" aria-label="Mover abajo" disabled={index === items.length - 1} onClick={() => move(index, 1)}><ArrowDown size={17} /></button></div>
            <div className="admin-work-actions"><button type="button" onClick={() => { setEditing(item); setModalOpen(true); }}><Pencil size={17} aria-hidden="true" />Editar</button><button type="button" disabled={busyId === item.id} onClick={() => patch(item, { isPublished: !item.isPublished })}>{item.isPublished ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}{item.isPublished ? "Ocultar" : "Mostrar"}</button><button type="button" onClick={() => patch(item, { isFeatured: !item.isFeatured })}><Sparkles size={17} aria-hidden="true" />{item.isFeatured ? "Quitar destaque" : "Destacar"}</button><button className="danger-link" type="button" onClick={() => setDeleteItem(item)}><Trash2 size={17} aria-hidden="true" />Eliminar</button></div>
          </article>;
        })}
      </div>
    </div>
    <AnimatePresence>{modalOpen && <PortfolioEditor item={editing} onClose={() => setModalOpen(false)} onSaved={(item) => { setItems((current) => editing ? current.map((entry) => entry.id === item.id ? item : entry) : [...current, item]); setModalOpen(false); setMessage(editing ? "Cambios guardados." : "Trabajo publicado correctamente."); }} reduceMotion={Boolean(reduceMotion)} />}</AnimatePresence>
    <AnimatePresence>{deleteItem && <motion.div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><div className="confirm-dialog"><h2 id="delete-title">¿Seguro que deseas eliminar este trabajo?</h2><p>Se ocultará del portafolio y quedará marcado para recuperación.</p><div><button className="button button-secondary" onClick={() => setDeleteItem(null)}>Cancelar</button><button className="button button-danger" onClick={remove}>{busyId ? <LoaderCircle className="spin" size={17} /> : <Trash2 size={17} />}Eliminar</button></div></div></motion.div>}</AnimatePresence>
  </main>;
}

function PortfolioEditor({ item, onClose, onSaved, reduceMotion }: { item: PortfolioItem | null; onClose: () => void; onSaved: (item: PortfolioItem) => void; reduceMotion: boolean }) {
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [coverImageId, setCoverImageId] = useState(item?.images.find((image) => image.isCover)?.id ?? item?.images[0]?.id ?? "");
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus());
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); previous?.focus(); previews.forEach((preview) => URL.revokeObjectURL(preview.url)); };
  }, [onClose, previews]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const formData = new FormData(event.currentTarget);
    if (item) {
      const body = Object.fromEntries(formData.entries());
      const response = await fetch(`/api/admin/portfolio/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: body.title, description: body.description, style: body.style, artist: body.artist, bodyPlacement: body.bodyPlacement, size: body.size, colorType: body.colorType, isFeatured: body.isFeatured === "true", isPublished: body.isPublished === "true", coverImageId, removeImageIds: removedImageIds }) });
      const result = await response.json(); if (response.ok) onSaved(result.item); else { setError(result.error); setSaving(false); } return;
    }
    files.forEach((file) => formData.append("images", file));
    try {
      const saved = await new Promise<PortfolioItem>((resolve, reject) => { const xhr = new XMLHttpRequest(); xhr.open("POST", "/api/admin/portfolio"); xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100)); xhr.onload = () => { const result = JSON.parse(xhr.responseText || "{}"); xhr.status < 300 ? resolve(result.item) : reject(new Error(result.error)); }; xhr.onerror = () => reject(new Error("Error de conexión.")); xhr.send(formData); });
      onSaved(saved);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo publicar."); setSaving(false); }
  }

  return <motion.div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><motion.div ref={panelRef} className="admin-editor" initial={reduceMotion ? false : { x: 40 }} animate={{ x: 0 }} exit={reduceMotion ? undefined : { x: 30 }}><div className="editor-head"><div><p className="eyebrow">{item ? "Editar trabajo" : "Publicación rápida"}</p><h2 id="editor-title">{item ? item.title : "Nuevo trabajo"}</h2></div><button className="icon-button" type="button" aria-label="Cerrar" onClick={onClose}><X /></button></div><form onSubmit={submit}>
    {!item && <><label className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setFiles(Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/")).slice(0, 8)); }}><input type="file" hidden multiple required accept="image/jpeg,image/png,image/webp" onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 8))} /><span><ImagePlus size={30} /><strong>Seleccionar fotografías</strong><br /><span className="muted">También puedes arrastrarlas o tomarlas desde tu teléfono</span></span></label>{previews.length > 0 && <div className="preview-grid">{previews.map((preview, index) => <div className="preview" key={preview.url}><Image src={preview.url} alt={`Vista previa ${index + 1}`} fill unoptimized /><button className="icon-button" type="button" aria-label="Eliminar imagen" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X size={17} /></button>{index === 0 && <span className="cover-label">Principal</span>}</div>)}</div>}</>}
    <div className="form-grid editor-fields">{item && item.images.length > 0 && <div className="existing-images"><span>Imágenes del trabajo</span><div className="existing-image-grid">{item.images.map((image) => { const removed = removedImageIds.includes(image.id); return <div className="existing-image" key={image.id} style={{ opacity: removed ? .35 : 1 }}><Image src={image.thumbnailUrl ?? image.optimizedUrl ?? image.imageUrl} alt={image.alt} fill sizes="180px" /><div className="existing-image-controls"><label><input type="radio" name="coverImage" checked={coverImageId === image.id && !removed} disabled={removed} onChange={() => setCoverImageId(image.id)} />Portada</label><label><input type="checkbox" checked={removed} onChange={(event) => setRemovedImageIds((current) => event.target.checked ? [...current, image.id] : current.filter((id) => id !== image.id))} />Quitar</label></div></div>; })}</div></div>}<div className="field full"><label htmlFor="work-title">Título</label><input id="work-title" name="title" defaultValue={item?.title ?? ""} placeholder="Opcional en publicación rápida" /></div><div className="field"><label htmlFor="work-style">Estilo *</label><select id="work-style" name="style" defaultValue={item?.style ?? "Black & grey"} required>{TATTOO_STYLES.map((style) => <option key={style}>{style}</option>)}</select></div><div className="field"><label htmlFor="work-artist">Tatuador</label><input id="work-artist" name="artist" defaultValue={item?.artist ?? ""} /></div><div className="field"><label htmlFor="work-placement">Zona del cuerpo</label><input id="work-placement" name="bodyPlacement" defaultValue={item?.bodyPlacement ?? ""} /></div><div className="field"><label htmlFor="work-size">Tamaño</label><input id="work-size" name="size" defaultValue={item?.size ?? ""} /></div><div className="field"><label htmlFor="work-color">Color</label><select id="work-color" name="colorType" defaultValue={item?.colorType ?? "black-and-grey"}><option value="black-and-grey">Blanco y negro</option><option value="color">Color</option></select></div><div className="field full"><label htmlFor="work-description">Descripción</label><textarea id="work-description" name="description" defaultValue={item?.description ?? ""} /></div><label className="toggle"><input type="checkbox" name="isPublishedCheck" defaultChecked={item?.isPublished ?? true} onChange={(e) => { const hidden = e.currentTarget.form?.elements.namedItem("isPublished") as HTMLInputElement; if (hidden) hidden.value = String(e.target.checked); }} /><span>Mostrar en portafolio</span></label><input type="hidden" name="isPublished" defaultValue={String(item?.isPublished ?? true)} /><label className="toggle"><input type="checkbox" name="isFeaturedCheck" defaultChecked={item?.isFeatured ?? false} onChange={(e) => { const hidden = e.currentTarget.form?.elements.namedItem("isFeatured") as HTMLInputElement; if (hidden) hidden.value = String(e.target.checked); }} /><span>Destacar trabajo</span></label><input type="hidden" name="isFeatured" defaultValue={String(item?.isFeatured ?? false)} /></div>
    {error && <p className="field-error" role="alert">{error}</p>}<div className="editor-actions"><button className="button button-secondary" type="button" onClick={onClose}>Cancelar</button><button className="button button-primary" disabled={saving || (!item && files.length === 0)}>{saving ? <><LoaderCircle className="spin" size={17} />Guardando {progress ? `${progress}%` : ""}</> : item ? "Guardar cambios" : "Publicar"}</button></div>
  </form></motion.div></motion.div>;
}
