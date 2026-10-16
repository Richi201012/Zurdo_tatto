import { Inbox } from "lucide-react";
import Link from "next/link";
import { REQUEST_STATUS_META, type RequestStatus } from "@/lib/booking/statuses";

export function AdminPageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return <header className="ops-page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</header>;
}

export function RequestStatusBadge({ status }: { status: RequestStatus | string }) {
  const meta = REQUEST_STATUS_META[status as RequestStatus] ?? { label: status, tone: "neutral" };
  return <span className={`ops-status ${meta.tone}`}>{meta.label}</span>;
}

export function EmptyState({ title, description, href, action }: { title: string; description: string; href?: string; action?: string }) {
  return <div className="ops-empty"><Inbox aria-hidden="true" /><h2>{title}</h2><p>{description}</p>{href && action && <Link className="button button-secondary" href={href}>{action}</Link>}</div>;
}

