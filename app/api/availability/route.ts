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
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo consultar la disponibilidad." }, { status: 500 });
  }
}
