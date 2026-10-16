export default function AdminLoading() {
  return <div className="admin-workspace" aria-busy="true" aria-live="polite"><div className="ops-skeleton heading" /><div className="ops-skeleton-grid">{Array.from({ length: 8 }, (_, index) => <div className="ops-skeleton card" key={index} />)}</div><span className="sr-only">Cargando administración…</span></div>;
}

