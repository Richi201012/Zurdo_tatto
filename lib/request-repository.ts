import { getDatabase } from "@/db";
import { clients, tattooRequestImages, tattooRequests, timelineEvents } from "@/db/schema";
import type { RequestStatus } from "@/lib/booking/statuses";
import type { TattooRequestData } from "@/types/request";

export interface StoredTattooRequest extends TattooRequestData { id: string; referenceImages: string[]; status: RequestStatus; createdAt: string }

export async function saveTattooRequest(request: StoredTattooRequest) {
  let folio = "";
  await getDatabase().transaction(async (tx) => {
    const [client] = await tx.insert(clients).values({ name: request.name, email: request.email.toLowerCase(), whatsapp: request.whatsapp, createdAt: request.createdAt, updatedAt: request.createdAt })
      .onConflictDoUpdate({ target: clients.email, set: { name: request.name, whatsapp: request.whatsapp, updatedAt: request.createdAt } }).returning({ id: clients.id });
    folio = `SOL-${new Date(request.createdAt).getFullYear()}-${request.id.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
    await tx.insert(tattooRequests).values({
      id: request.id, folio, clientId: client.id, name: request.name, whatsapp: request.whatsapp, email: request.email.toLowerCase(), idea: request.idea,
      bodyPlacement: request.bodyPlacement, approximateSize: request.approximateSize, colorPreference: request.colorPreference,
      preferredDay: request.preferredDay, preferredTime: request.preferredTime, referencePortfolioItemId: request.referencePortfolioItemId || null,
      artistId: null, status: request.status, nextAction: "Asignar fecha y hora desde el backoffice", lastInteractionAt: request.createdAt, createdAt: request.createdAt, updatedAt: request.createdAt,
    });
    if (request.referenceImages.length) await tx.insert(tattooRequestImages).values(request.referenceImages.map((imageUrl, sortOrder) => ({ tattooRequestId: request.id, imageUrl, sortOrder })));
    await tx.insert(timelineEvents).values({ clientId: client.id, requestId: request.id, type: "REQUEST_RECEIVED", title: "Solicitud recibida", detail: `Día preferido: ${request.preferredDay}. Horario pendiente de asignación por el estudio.`, actor: "Sistema", metadata: { termsAccepted: true, termsVersion: request.termsVersion }, createdAt: request.createdAt });
  });
  return { ...request, folio };
}
