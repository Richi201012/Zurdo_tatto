import type { AppointmentStatus, PaymentStatus, RequestStatus } from "@/lib/booking/statuses";

export interface AdminRequestListItem {
  id: string;
  folio: string;
  clientId: string;
  clientName: string;
  email: string;
  whatsapp: string;
  idea: string;
  bodyPlacement: string;
  approximateSize: string;
  colorPreference: string;
  style: string;
  artistName: string;
  status: RequestStatus;
  nextAction: string;
  createdAt: string;
  lastInteractionAt: string;
  depositStatus: PaymentStatus | null;
}

export interface UpcomingAppointment {
  id: string;
  folio: string;
  clientName: string;
  artistName: string;
  startAt: string;
  endAt: string;
  summary: string;
  status: AppointmentStatus;
  depositCents: number;
  paidCents: number;
  balanceCents: number;
}

