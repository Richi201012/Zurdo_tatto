export const REQUEST_STATUSES = [
  "NEW_REQUEST",
  "UNDER_REVIEW",
  "NEEDS_INFORMATION",
  "QUOTED",
  "WAITING_CLIENT_CONFIRMATION",
  "WAITING_AVAILABILITY_SELECTION",
  "WAITING_DEPOSIT",
  "DEPOSIT_PENDING_VERIFICATION",
  "DEPOSIT_PAID",
  "APPOINTMENT_CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "RESCHEDULE_REQUESTED",
  "RESCHEDULED",
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_STUDIO",
  "NO_SHOW",
  "REFUNDED",
  "ARCHIVED",
] as const;

export const APPOINTMENT_STATUSES = [
  "TENTATIVE",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "RESCHEDULED",
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_STUDIO",
  "NO_SHOW",
  "EXPIRED",
] as const;

export const PAYMENT_STATUSES = ["PENDING", "REPORTED", "UNDER_REVIEW", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"] as const;
export const AVAILABILITY_STATUSES = ["HELD", "SELECTED", "RELEASED", "EXPIRED"] as const;
export const EMAIL_STATUSES = ["QUEUED", "SENT", "DELIVERED", "FAILED", "BOUNCED", "BLOCKED", "SPAM"] as const;
export const ADMIN_ROLES = ["ADMIN", "ARTIST", "RECEPTION"] as const;

export type RequestStatus = typeof REQUEST_STATUSES[number];
export type AppointmentStatus = typeof APPOINTMENT_STATUSES[number];
export type PaymentStatus = typeof PAYMENT_STATUSES[number];
export type AvailabilityStatus = typeof AVAILABILITY_STATUSES[number];
export type EmailStatus = typeof EMAIL_STATUSES[number];
export type AdminRole = typeof ADMIN_ROLES[number];

export const REQUEST_STATUS_META: Record<RequestStatus, { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }> = {
  NEW_REQUEST: { label: "Nueva", tone: "info" },
  UNDER_REVIEW: { label: "En revisión", tone: "info" },
  NEEDS_INFORMATION: { label: "Falta información", tone: "warning" },
  QUOTED: { label: "Cotizada", tone: "info" },
  WAITING_CLIENT_CONFIRMATION: { label: "Esperando respuesta", tone: "warning" },
  WAITING_AVAILABILITY_SELECTION: { label: "Eligiendo horario", tone: "warning" },
  WAITING_DEPOSIT: { label: "Esperando anticipo", tone: "warning" },
  DEPOSIT_PENDING_VERIFICATION: { label: "Pago por verificar", tone: "warning" },
  DEPOSIT_PAID: { label: "Anticipo pagado", tone: "success" },
  APPOINTMENT_CONFIRMED: { label: "Cita confirmada", tone: "success" },
  IN_PROGRESS: { label: "En sesión", tone: "info" },
  COMPLETED: { label: "Completada", tone: "success" },
  RESCHEDULE_REQUESTED: { label: "Cambio solicitado", tone: "warning" },
  RESCHEDULED: { label: "Reprogramada", tone: "info" },
  CANCELLED_BY_CLIENT: { label: "Cancelada por cliente", tone: "danger" },
  CANCELLED_BY_STUDIO: { label: "Cancelada por estudio", tone: "danger" },
  NO_SHOW: { label: "No se presentó", tone: "danger" },
  REFUNDED: { label: "Anticipo devuelto", tone: "neutral" },
  ARCHIVED: { label: "Archivada", tone: "neutral" },
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  TENTATIVE: "Tentativa",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "En sesión",
  COMPLETED: "Realizada",
  RESCHEDULED: "Reprogramada",
  CANCELLED_BY_CLIENT: "Cancelada por cliente",
  CANCELLED_BY_STUDIO: "Cancelada por estudio",
  NO_SHOW: "No se presentó",
  EXPIRED: "Vencida por falta de anticipo",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  REPORTED: "Reportado",
  UNDER_REVIEW: "En revisión",
  PAID: "Pagado",
  FAILED: "Fallido",
  REFUNDED: "Devuelto",
  PARTIALLY_REFUNDED: "Devolución parcial",
};

export function isRequestStatus(value: string): value is RequestStatus {
  return REQUEST_STATUSES.includes(value as RequestStatus);
}

