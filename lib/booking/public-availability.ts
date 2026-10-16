import { and, eq, gt, inArray, lt } from "drizzle-orm";
import { studioConfig } from "@/config/studio";
import { getDatabase } from "@/db";
import { appointments, artists, availabilityExceptions, studioSettings } from "@/db/schema";
import { expireUnpaidAppointments } from "@/lib/booking/expiration";

export interface PublicBookingSlot { artistId: string; artistName: string; startAt: string; endAt: string }
export interface BookingSettings {
  timezone: string; defaultDurationMinutes: number; bufferMinutes: number; depositDueHours: number; depositRequiredCents: number;
  paymentInstructions: string; acceptedPaymentMethods: string[]; transferBank: string; transferBeneficiary: string; transferClabe: string; transferAccount: string;
}
const DEFAULT_SETTINGS: BookingSettings = {
  timezone: "America/Mexico_City", defaultDurationMinutes: 120, bufferMinutes: 30, depositDueHours: studioConfig.booking.paymentWindowHours,
  depositRequiredCents: 50000, paymentInstructions: "", acceptedPaymentMethods: [], transferBank: "", transferBeneficiary: "", transferClabe: "", transferAccount: "",
};

function dateKey(value: Date, timeZone: string) { return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(value); }
function addDays(key: string, amount: number) { const [year, month, day] = key.split("-").map(Number); return new Date(Date.UTC(year, month - 1, day + amount)).toISOString().slice(0, 10); }
export function localDateTimeToIso(dayKey: string, time: string, timeZone: string) {
  const [year, month, day] = dayKey.split("-").map(Number); const [hour, minute, second = 0] = time.split(":").map(Number); const target = Date.UTC(year, month - 1, day, hour, minute, second); let guess = target;
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  for (let iteration = 0; iteration < 2; iteration += 1) { const parts = Object.fromEntries(formatter.formatToParts(new Date(guess)).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)])); const represented = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second); guess += target - represented; }
  return new Date(guess).toISOString();
}
function overlaps(startA: string, endA: string, startB: string, endB: string) { return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB); }

async function getActiveArtists() {
  const db = getDatabase();
  let rows = await db.select({ id: artists.id, name: artists.name }).from(artists).where(eq(artists.isActive, true));
  if (rows.length) return rows;
  const now = new Date().toISOString();
  const [created] = await db.insert(artists).values({ name: studioConfig.shortName || studioConfig.name, slug: "studio-primary", isActive: true, createdAt: now, updatedAt: now }).onConflictDoUpdate({ target: artists.slug, set: { isActive: true, updatedAt: now } }).returning({ id: artists.id, name: artists.name });
  rows = [created];
  return rows;
}

export async function getBookingSettings(): Promise<BookingSettings> {
  const [stored] = await getDatabase().select().from(studioSettings).where(eq(studioSettings.id, "default")).limit(1);
  if (!stored) return DEFAULT_SETTINGS;
  return { timezone: stored.timezone, defaultDurationMinutes: stored.defaultDurationMinutes, bufferMinutes: stored.bufferMinutes, depositDueHours: studioConfig.booking.paymentWindowHours, depositRequiredCents: stored.depositType === "FIXED" ? stored.depositValue : 0, paymentInstructions: stored.paymentInstructions, acceptedPaymentMethods: stored.acceptedPaymentMethods, transferBank: stored.transferBank, transferBeneficiary: stored.transferBeneficiary, transferClabe: stored.transferClabe, transferAccount: stored.transferAccount };
}

export async function getPublicBookingSlots(days = 60): Promise<{ slots: PublicBookingSlot[]; settings: BookingSettings }> {
  await expireUnpaidAppointments();
  const [settings, artistRows] = await Promise.all([getBookingSettings(), getActiveArtists()]);
  const now = new Date(); const firstDay = dateKey(now, settings.timezone); const lastDay = addDays(firstDay, days);
  const rangeStart = localDateTimeToIso(firstDay, "00:00:00", settings.timezone); const rangeEnd = localDateTimeToIso(lastDay, "23:59:59", settings.timezone); const db = getDatabase();
  const [exceptionRows, appointmentRows] = await Promise.all([
    db.select().from(availabilityExceptions).where(and(gt(availabilityExceptions.date, addDays(firstDay, -1)), lt(availabilityExceptions.date, addDays(lastDay, 1)))),
    db.select({ artistId: appointments.artistId, startAt: appointments.startAt, endAt: appointments.endAt }).from(appointments).where(and(inArray(appointments.status, ["TENTATIVE", "CONFIRMED", "RESCHEDULED", "IN_PROGRESS"]), lt(appointments.startAt, rangeEnd), gt(appointments.endAt, rangeStart))),
  ]);
  const slots: PublicBookingSlot[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const day = addDays(firstDay, offset);
    for (const artist of artistRows) {
      const exceptions = exceptionRows.filter((item) => item.artistId === artist.id && item.date === day);
      if (exceptions.some((item) => item.kind !== "SPECIAL_HOURS" && !item.startTime)) continue;
      const special = exceptions.find((item) => item.kind === "SPECIAL_HOURS" && item.startTime && item.endTime);
      const workStart = localDateTimeToIso(day, special?.startTime ?? studioConfig.booking.dailyStartTime, settings.timezone);
      const workEnd = localDateTimeToIso(day, special?.endTime ?? studioConfig.booking.dailyEndTime, settings.timezone);
      const durationMinutes = settings.defaultDurationMinutes; const incrementMinutes = durationMinutes + settings.bufferMinutes;
      for (let cursor = new Date(workStart); cursor.getTime() + durationMinutes * 60000 <= new Date(workEnd).getTime(); cursor = new Date(cursor.getTime() + incrementMinutes * 60000)) {
        const startAt = cursor.toISOString(); const endAt = new Date(cursor.getTime() + durationMinutes * 60000).toISOString();
        if (new Date(startAt).getTime() < now.getTime() + studioConfig.booking.minimumAdvanceMinutes * 60000) continue;
        const partiallyBlocked = exceptions.some((item) => item.kind !== "SPECIAL_HOURS" && item.startTime && item.endTime && overlaps(startAt, endAt, localDateTimeToIso(day, item.startTime, settings.timezone), localDateTimeToIso(day, item.endTime, settings.timezone)));
        if (partiallyBlocked) continue;
        const occupied = appointmentRows.some((item) => item.artistId === artist.id && overlaps(startAt, endAt, item.startAt, item.endAt));
        if (!occupied) slots.push({ artistId: artist.id, artistName: artist.name, startAt, endAt });
      }
    }
  }
  return { slots: slots.sort((a, b) => a.startAt.localeCompare(b.startAt)).slice(0, 240), settings };
}

export async function assertPublicSlotAvailable(input: { artistId: string; startAt: string; endAt: string }) { const { slots } = await getPublicBookingSlots(); return slots.some((slot) => slot.artistId === input.artistId && slot.startAt === input.startAt && slot.endAt === input.endAt); }
