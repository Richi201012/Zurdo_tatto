import { and, asc, desc, eq, gt, gte, ilike, inArray, lte, ne, or, sql } from "drizzle-orm";
import { getDatabase } from "@/db";
import {
  appointments,
  artists,
  availabilityExceptions,
  availabilityOffers,
  availabilityRules,
  clients,
  emailLogs,
  internalNotes,
  payments,
  quotes,
  tattooRequestImages,
  tattooRequests,
  timelineEvents,
} from "@/db/schema";
import type { AppointmentStatus, PaymentStatus, RequestStatus } from "@/lib/booking/statuses";
import { expireUnpaidAppointments } from "@/lib/booking/expiration";
import type { AdminRequestListItem, UpcomingAppointment } from "@/types/admin";

export interface RequestFilters { status?: string; query?: string; artist?: string; style?: string; deposit?: string }

export async function listAdminRequests(filters: RequestFilters = {}): Promise<AdminRequestListItem[]> {
  await expireUnpaidAppointments();
  const conditions = [];
  if (filters.status && filters.status !== "ALL") conditions.push(eq(tattooRequests.status, filters.status));
  if (filters.artist) conditions.push(eq(tattooRequests.artistId, filters.artist));
  if (filters.style) conditions.push(eq(tattooRequests.style, filters.style));
  if (filters.query) {
    const query = `%${filters.query}%`;
    conditions.push(or(ilike(tattooRequests.name, query), ilike(tattooRequests.email, query), ilike(tattooRequests.whatsapp, query), ilike(tattooRequests.folio, query))!);
  }
  const rows = await getDatabase().select({
    id: tattooRequests.id,
    folio: tattooRequests.folio,
    clientId: tattooRequests.clientId,
    clientName: tattooRequests.name,
    email: tattooRequests.email,
    whatsapp: tattooRequests.whatsapp,
    idea: tattooRequests.idea,
    bodyPlacement: tattooRequests.bodyPlacement,
    approximateSize: tattooRequests.approximateSize,
    colorPreference: tattooRequests.colorPreference,
    style: tattooRequests.style,
    artistName: artists.name,
    status: tattooRequests.status,
    nextAction: tattooRequests.nextAction,
    createdAt: tattooRequests.createdAt,
    lastInteractionAt: tattooRequests.lastInteractionAt,
    depositStatus: sql<string | null>`(select p.status from payments p where p.request_id = ${tattooRequests.id} order by p.created_at desc limit 1)`,
  }).from(tattooRequests).leftJoin(artists, eq(tattooRequests.artistId, artists.id)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(tattooRequests.createdAt));
  return rows.map((row) => ({ ...row, artistName: row.artistName ?? "Sin asignar", status: row.status as RequestStatus, depositStatus: row.depositStatus as PaymentStatus | null }));
}

export async function getRequestDetail(id: string) {
  await expireUnpaidAppointments();
  const [request] = await getDatabase().select({
    id: tattooRequests.id, folio: tattooRequests.folio, clientId: tattooRequests.clientId, name: tattooRequests.name,
    whatsapp: tattooRequests.whatsapp, email: tattooRequests.email, idea: tattooRequests.idea, bodyPlacement: tattooRequests.bodyPlacement,
    approximateSize: tattooRequests.approximateSize, colorPreference: tattooRequests.colorPreference, preferredDay: tattooRequests.preferredDay,
    preferredTime: tattooRequests.preferredTime, style: tattooRequests.style, artistId: tattooRequests.artistId, artistName: artists.name,
    status: tattooRequests.status, nextAction: tattooRequests.nextAction, referencePortfolioItemId: tattooRequests.referencePortfolioItemId,
    createdAt: tattooRequests.createdAt, updatedAt: tattooRequests.updatedAt, lastInteractionAt: tattooRequests.lastInteractionAt,
    clientCreatedAt: clients.createdAt,
  }).from(tattooRequests).innerJoin(clients, eq(tattooRequests.clientId, clients.id)).leftJoin(artists, eq(tattooRequests.artistId, artists.id)).where(eq(tattooRequests.id, id)).limit(1);
  if (!request) return null;
  const [images, quoteRows, offerRows, appointmentRows, paymentRows, notes, events, emails, clientAppointments] = await Promise.all([
    getDatabase().select().from(tattooRequestImages).where(eq(tattooRequestImages.tattooRequestId, id)).orderBy(asc(tattooRequestImages.sortOrder)),
    getDatabase().select().from(quotes).where(eq(quotes.requestId, id)).orderBy(desc(quotes.createdAt)).limit(1),
    getDatabase().select({ id: availabilityOffers.id, startAt: availabilityOffers.startAt, endAt: availabilityOffers.endAt, status: availabilityOffers.status, expiresAt: availabilityOffers.expiresAt, artistName: artists.name }).from(availabilityOffers).leftJoin(artists, eq(availabilityOffers.artistId, artists.id)).where(eq(availabilityOffers.requestId, id)).orderBy(asc(availabilityOffers.startAt)),
    getDatabase().select({ id: appointments.id, folio: appointments.folio, artistId: appointments.artistId, startAt: appointments.startAt, endAt: appointments.endAt, status: appointments.status, summary: appointments.summary, artistName: artists.name }).from(appointments).leftJoin(artists, eq(appointments.artistId, artists.id)).where(and(eq(appointments.requestId, id), ne(appointments.status, "EXPIRED"))).limit(1),
    getDatabase().select().from(payments).where(eq(payments.requestId, id)).orderBy(desc(payments.createdAt)).limit(1),
    getDatabase().select().from(internalNotes).where(eq(internalNotes.requestId, id)).orderBy(desc(internalNotes.createdAt)),
    getDatabase().select().from(timelineEvents).where(eq(timelineEvents.requestId, id)).orderBy(desc(timelineEvents.createdAt)),
    getDatabase().select().from(emailLogs).where(eq(emailLogs.requestId, id)).orderBy(desc(emailLogs.createdAt)),
    getDatabase().select({ id: appointments.id, folio: appointments.folio, startAt: appointments.startAt, status: appointments.status }).from(appointments).where(eq(appointments.clientId, request.clientId)).orderBy(desc(appointments.startAt)),
  ]);
  return { ...request, status: request.status as RequestStatus, artistName: request.artistName ?? "Sin asignar", images, quote: quoteRows[0] ?? null, offers: offerRows, appointment: appointmentRows[0] ? { ...appointmentRows[0], status: appointmentRows[0].status as AppointmentStatus } : null, payment: paymentRows[0] ? { ...paymentRows[0], status: paymentRows[0].status as PaymentStatus } : null, notes, events, emails, clientAppointments };
}

export async function getDashboardData() {
  await expireUnpaidAppointments();
  const db = getDatabase();
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const nextWeek = new Date(now.getTime() + 7 * 86400000);
  const requestRows = await db.select({ status: tattooRequests.status, count: sql<number>`count(*)::int` }).from(tattooRequests).groupBy(tattooRequests.status);
  const counts = Object.fromEntries(requestRows.map((row) => [row.status, Number(row.count)]));
  const upcomingRows = await db.select({
    id: appointments.id, folio: appointments.folio, clientName: clients.name, artistName: artists.name,
    startAt: appointments.startAt, endAt: appointments.endAt, summary: appointments.summary, status: appointments.status,
    depositCents: payments.depositRequiredCents, paidCents: payments.paidCents,
  }).from(appointments).innerJoin(clients, eq(appointments.clientId, clients.id)).innerJoin(artists, eq(appointments.artistId, artists.id)).leftJoin(payments, eq(payments.appointmentId, appointments.id)).where(and(gte(appointments.startAt, now.toISOString()), lte(appointments.startAt, nextWeek.toISOString()), inArray(appointments.status, ["TENTATIVE", "CONFIRMED", "RESCHEDULED"]))).orderBy(asc(appointments.startAt)).limit(8);
  const upcoming: UpcomingAppointment[] = upcomingRows.map((row) => ({ ...row, status: row.status as AppointmentStatus, depositCents: row.depositCents ?? 0, paidCents: row.paidCents ?? 0, balanceCents: Math.max(0, (row.depositCents ?? 0) - (row.paidCents ?? 0)) }));
  const [todayCount] = await db.select({ count: sql<number>`count(*)::int` }).from(appointments).where(and(gte(appointments.startAt, todayStart.toISOString()), lte(appointments.startAt, todayEnd.toISOString())));
  const [confirmedCount] = await db.select({ count: sql<number>`count(*)::int` }).from(appointments).where(eq(appointments.status, "CONFIRMED"));
  const [paidCount] = await db.select({ count: sql<number>`count(*)::int` }).from(payments).where(eq(payments.status, "PAID"));
  const staleDate = new Date(now.getTime() - 3 * 86400000).toISOString();
  const [staleCount] = await db.select({ count: sql<number>`count(*)::int` }).from(tattooRequests).where(and(lte(tattooRequests.lastInteractionAt, staleDate), inArray(tattooRequests.status, ["NEW_REQUEST", "UNDER_REVIEW", "NEEDS_INFORMATION", "WAITING_CLIENT_CONFIRMATION"])));
  const pendingActions = await listAdminRequests({});
  return {
    metrics: {
      newRequests: counts.NEW_REQUEST ?? 0,
      waitingQuote: (counts.UNDER_REVIEW ?? 0) + (counts.NEEDS_INFORMATION ?? 0),
      waitingDeposit: counts.WAITING_DEPOSIT ?? 0,
      depositsPaid: Number(paidCount?.count ?? 0),
      confirmedAppointments: Number(confirmedCount?.count ?? 0),
      todayAppointments: Number(todayCount?.count ?? 0),
      upcomingAppointments: upcoming.length,
      pendingReschedules: counts.RESCHEDULE_REQUESTED ?? 0,
      cancellations: (counts.CANCELLED_BY_CLIENT ?? 0) + (counts.CANCELLED_BY_STUDIO ?? 0),
      unanswered: Number(staleCount?.count ?? 0),
    },
    upcoming,
    pendingActions: pendingActions.filter((item) => !["COMPLETED", "ARCHIVED", "CANCELLED_BY_CLIENT", "CANCELLED_BY_STUDIO"].includes(item.status)).slice(0, 8),
  };
}

export async function listArtists() { return getDatabase().select().from(artists).where(eq(artists.isActive, true)).orderBy(asc(artists.name)); }

export async function listAppointments(filters: { from?: string; to?: string; status?: string } = {}) {
  await expireUnpaidAppointments();
  const conditions = [];
  if (filters.from) conditions.push(gte(appointments.startAt, filters.from));
  if (filters.to) conditions.push(lte(appointments.startAt, filters.to));
  if (filters.status && filters.status !== "ALL") conditions.push(eq(appointments.status, filters.status));
  return getDatabase().select({ id: appointments.id, folio: appointments.folio, requestId: appointments.requestId, clientName: clients.name, artistName: artists.name, startAt: appointments.startAt, endAt: appointments.endAt, status: appointments.status, summary: appointments.summary, paymentStatus: payments.status, paidCents: payments.paidCents, depositCents: payments.depositRequiredCents }).from(appointments).innerJoin(clients, eq(appointments.clientId, clients.id)).innerJoin(artists, eq(appointments.artistId, artists.id)).leftJoin(payments, eq(payments.appointmentId, appointments.id)).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(appointments.startAt));
}

export async function getAdminCalendarData(from: string, to: string) {
  const fromDay = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date(from));
  const toDay = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date(new Date(to).getTime() - 1));
  const [appointmentRows, heldOffers, rules, exceptions] = await Promise.all([
    listAppointments({ from, to }),
    getDatabase().select({ id: availabilityOffers.id, requestId: availabilityOffers.requestId, startAt: availabilityOffers.startAt, endAt: availabilityOffers.endAt, expiresAt: availabilityOffers.expiresAt, clientName: clients.name, artistName: artists.name }).from(availabilityOffers).innerJoin(tattooRequests, eq(availabilityOffers.requestId, tattooRequests.id)).innerJoin(clients, eq(tattooRequests.clientId, clients.id)).innerJoin(artists, eq(availabilityOffers.artistId, artists.id)).where(and(eq(availabilityOffers.status, "HELD"), gt(availabilityOffers.expiresAt, new Date().toISOString()), gte(availabilityOffers.startAt, from), lte(availabilityOffers.startAt, to))).orderBy(asc(availabilityOffers.startAt)),
    getDatabase().select({ id: availabilityRules.id, artistId: availabilityRules.artistId, artistName: artists.name, weekday: availabilityRules.weekday, startTime: availabilityRules.startTime, endTime: availabilityRules.endTime, breakStartTime: availabilityRules.breakStartTime, breakEndTime: availabilityRules.breakEndTime }).from(availabilityRules).innerJoin(artists, eq(availabilityRules.artistId, artists.id)).where(eq(availabilityRules.isActive, true)).orderBy(asc(artists.name)),
    getDatabase().select({ id: availabilityExceptions.id, artistId: availabilityExceptions.artistId, artistName: artists.name, date: availabilityExceptions.date, startTime: availabilityExceptions.startTime, endTime: availabilityExceptions.endTime, kind: availabilityExceptions.kind, reason: availabilityExceptions.reason }).from(availabilityExceptions).innerJoin(artists, eq(availabilityExceptions.artistId, artists.id)).where(and(gte(availabilityExceptions.date, fromDay), lte(availabilityExceptions.date, toDay))).orderBy(asc(availabilityExceptions.date)),
  ]);
  return { appointments: appointmentRows, heldOffers, rules, exceptions };
}

export async function listPayments() {
  return getDatabase().select({ id: payments.id, requestId: payments.requestId, requestFolio: tattooRequests.folio, clientName: clients.name, totalCents: payments.totalCents, depositRequiredCents: payments.depositRequiredCents, paidCents: payments.paidCents, status: payments.status, method: payments.paymentMethod, reference: payments.externalReference, dueAt: payments.dueAt, updatedAt: payments.updatedAt }).from(payments).innerJoin(tattooRequests, eq(payments.requestId, tattooRequests.id)).innerJoin(clients, eq(payments.clientId, clients.id)).orderBy(desc(payments.updatedAt));
}

export async function listClients() {
  return getDatabase().select({ id: clients.id, name: clients.name, email: clients.email, whatsapp: clients.whatsapp, createdAt: clients.createdAt, requestCount: sql<number>`(select count(*)::int from tattoo_requests r where r.client_id = ${clients.id})`, appointmentCount: sql<number>`(select count(*)::int from appointments a where a.client_id = ${clients.id})`, paidCents: sql<number>`(select coalesce(sum(p.paid_cents), 0)::int from payments p where p.client_id = ${clients.id})` }).from(clients).orderBy(asc(clients.name));
}

export async function getClientDetail(id: string) {
  const [client] = await getDatabase().select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) return null;
  const [requests, appointmentRows, paymentRows, events] = await Promise.all([
    getDatabase().select({ id: tattooRequests.id, folio: tattooRequests.folio, idea: tattooRequests.idea, style: tattooRequests.style, status: tattooRequests.status, nextAction: tattooRequests.nextAction, createdAt: tattooRequests.createdAt }).from(tattooRequests).where(eq(tattooRequests.clientId, id)).orderBy(desc(tattooRequests.createdAt)),
    getDatabase().select({ id: appointments.id, requestId: appointments.requestId, folio: appointments.folio, startAt: appointments.startAt, endAt: appointments.endAt, status: appointments.status, summary: appointments.summary, artistName: artists.name }).from(appointments).innerJoin(artists, eq(appointments.artistId, artists.id)).where(eq(appointments.clientId, id)).orderBy(desc(appointments.startAt)),
    getDatabase().select({ id: payments.id, requestId: payments.requestId, totalCents: payments.totalCents, depositRequiredCents: payments.depositRequiredCents, paidCents: payments.paidCents, status: payments.status, paymentMethod: payments.paymentMethod, updatedAt: payments.updatedAt }).from(payments).where(eq(payments.clientId, id)).orderBy(desc(payments.updatedAt)),
    getDatabase().select().from(timelineEvents).where(eq(timelineEvents.clientId, id)).orderBy(desc(timelineEvents.createdAt)).limit(50),
  ]);
  return { client, requests, appointments: appointmentRows, payments: paymentRows, events };
}

export async function getAvailabilityData() {
  const [artistRows, ruleRows, exceptionRows] = await Promise.all([
    listArtists(),
    getDatabase().select({ id: availabilityRules.id, artistId: availabilityRules.artistId, artistName: artists.name, weekday: availabilityRules.weekday, startTime: availabilityRules.startTime, endTime: availabilityRules.endTime, breakStartTime: availabilityRules.breakStartTime, breakEndTime: availabilityRules.breakEndTime, minimumMinutes: availabilityRules.minimumMinutes, bufferMinutes: availabilityRules.bufferMinutes, isActive: availabilityRules.isActive }).from(availabilityRules).innerJoin(artists, eq(availabilityRules.artistId, artists.id)).orderBy(asc(artists.name), asc(availabilityRules.weekday)),
    getDatabase().select({ id: availabilityExceptions.id, artistId: availabilityExceptions.artistId, artistName: artists.name, date: availabilityExceptions.date, startTime: availabilityExceptions.startTime, endTime: availabilityExceptions.endTime, kind: availabilityExceptions.kind, reason: availabilityExceptions.reason }).from(availabilityExceptions).innerJoin(artists, eq(availabilityExceptions.artistId, artists.id)).where(gte(availabilityExceptions.date, new Date().toISOString().slice(0, 10))).orderBy(asc(availabilityExceptions.date)),
  ]);
  return { artists: artistRows, rules: ruleRows, exceptions: exceptionRows };
}

export async function listEmailLogs() { return getDatabase().select().from(emailLogs).orderBy(desc(emailLogs.createdAt)).limit(100); }
