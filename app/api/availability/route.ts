import { NextResponse } from "next/server";
import { studioConfig } from "@/config/studio";
import { getPublicBookingSlots } from "@/lib/booking/public-availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { slots, settings } = await getPublicBookingSlots();
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: settings.timezone, year: "numeric", month: "2-digit", day: "2-digit" });
    return NextResponse.json({
      availableDates: Array.from(new Set(slots.map((slot) => formatter.format(new Date(slot.startAt))))),
      terms: studioConfig.policies.bookingTerms,
      termsVersion: studioConfig.policies.bookingTermsVersion,
    });
  } catch (error) {
    console.error("No se pudo consultar la disponibilidad pública.", error);
    return NextResponse.json({ error: "No pudimos consultar la disponibilidad en este momento. Intenta nuevamente." }, { status: 500 });
  }
}
