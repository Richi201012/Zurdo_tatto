import { boolean, date, index, integer, jsonb, pgTable, text, time, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const tattooStyles = pgTable("tattoo_styles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const artists = pgTable("artists", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  bio: text("bio").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("RECEPTION"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  whatsapp: text("whatsapp").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("clients_name_idx").on(table.name), index("clients_whatsapp_idx").on(table.whatsapp)]);

export const portfolioItems = pgTable("portfolio_items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  styleId: text("style_id").notNull().references(() => tattooStyles.id, { onDelete: "restrict" }),
  artistId: uuid("artist_id").references(() => artists.id, { onDelete: "set null" }),
  artistName: text("artist_name").notNull().default(""),
  bodyPlacement: text("body_placement").notNull().default(""),
  size: text("size").notNull().default(""),
  colorType: text("color_type").notNull().default("black-and-grey"),
  performedAt: timestamp("performed_at", { withTimezone: true, mode: "string" }),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  isFeatured: boolean("is_featured").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
}, (table) => [
  index("portfolio_items_public_idx").on(table.isPublished, table.deletedAt, table.sortOrder),
  index("portfolio_items_style_idx").on(table.styleId),
]);

export const portfolioImages = pgTable("portfolio_images", {
  id: text("id").primaryKey(),
  portfolioItemId: text("portfolio_item_id").notNull().references(() => portfolioItems.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  optimizedUrl: text("optimized_url"),
  thumbnailUrl: text("thumbnail_url"),
  alt: text("alt").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  isCover: boolean("is_cover").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("portfolio_images_item_order_idx").on(table.portfolioItemId, table.sortOrder)]);

export const tattooRequests = pgTable("tattoo_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  folio: text("folio").notNull().unique(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  whatsapp: text("whatsapp").notNull(),
  email: text("email").notNull(),
  idea: text("idea").notNull(),
  bodyPlacement: text("body_placement").notNull(),
  approximateSize: text("approximate_size").notNull(),
  colorPreference: text("color_preference").notNull(),
  preferredDay: text("preferred_day").notNull(),
  preferredTime: text("preferred_time").notNull(),
  referencePortfolioItemId: text("reference_portfolio_item_id").references(() => portfolioItems.id, { onDelete: "set null" }),
  style: text("style").notNull().default(""),
  artistId: uuid("artist_id").references(() => artists.id, { onDelete: "set null" }),
  status: text("status").notNull().default("NEW_REQUEST"),
  nextAction: text("next_action").notNull().default("Revisar solicitud"),
  lastInteractionAt: timestamp("last_interaction_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  archivedAt: timestamp("archived_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [
  index("tattoo_requests_status_created_idx").on(table.status, table.createdAt),
  index("tattoo_requests_client_idx").on(table.clientId),
  index("tattoo_requests_artist_idx").on(table.artistId),
]);

export const tattooRequestImages = pgTable("tattoo_request_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  tattooRequestId: uuid("tattoo_request_id").notNull().references(() => tattooRequests.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => tattooRequests.id, { onDelete: "restrict" }),
  minPriceCents: integer("min_price_cents").notNull().default(0),
  maxPriceCents: integer("max_price_cents").notNull().default(0),
  depositRequiredCents: integer("deposit_required_cents").notNull().default(0),
  estimatedMinutes: integer("estimated_minutes").notNull().default(120),
  sessionCount: integer("session_count").notNull().default(1),
  artistId: uuid("artist_id").references(() => artists.id, { onDelete: "set null" }),
  comments: text("comments").notNull().default(""),
  status: text("status").notNull().default("DRAFT"),
  sentAt: timestamp("sent_at", { withTimezone: true, mode: "string" }),
  createdBy: text("created_by").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("quotes_request_idx").on(table.requestId, table.createdAt)]);

export const availabilityRules = pgTable("availability_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  breakStartTime: time("break_start_time"),
  breakEndTime: time("break_end_time"),
  minimumMinutes: integer("minimum_minutes").notNull().default(60),
  bufferMinutes: integer("buffer_minutes").notNull().default(30),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [uniqueIndex("availability_rules_artist_weekday_idx").on(table.artistId, table.weekday)]);

export const availabilityExceptions = pgTable("availability_exceptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  kind: text("kind").notNull().default("BLOCKED"),
  reason: text("reason").notNull().default(""),
  createdBy: text("created_by").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("availability_exceptions_artist_date_idx").on(table.artistId, table.date)]);

export const availabilityTokens = pgTable("availability_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => tattooRequests.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const availabilityOffers = pgTable("availability_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => tattooRequests.id, { onDelete: "cascade" }),
  tokenId: uuid("token_id").notNull().references(() => availabilityTokens.id, { onDelete: "cascade" }),
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "restrict" }),
  startAt: timestamp("start_at", { withTimezone: true, mode: "string" }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true, mode: "string" }).notNull(),
  status: text("status").notNull().default("HELD"),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  selectedAt: timestamp("selected_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("availability_offers_artist_time_idx").on(table.artistId, table.startAt, table.endAt), index("availability_offers_request_idx").on(table.requestId)]);

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  folio: text("folio").notNull().unique(),
  requestId: uuid("request_id").notNull().unique().references(() => tattooRequests.id, { onDelete: "restrict" }),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "restrict" }),
  startAt: timestamp("start_at", { withTimezone: true, mode: "string" }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true, mode: "string" }).notNull(),
  status: text("status").notNull().default("TENTATIVE"),
  summary: text("summary").notNull().default(""),
  location: text("location").notNull().default(""),
  reminder48hSentAt: timestamp("reminder_48h_sent_at", { withTimezone: true, mode: "string" }),
  reminder24hSentAt: timestamp("reminder_24h_sent_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("appointments_artist_start_idx").on(table.artistId, table.startAt), index("appointments_status_start_idx").on(table.status, table.startAt)]);

export const appointmentHistory = pgTable("appointment_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  appointmentId: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: "restrict" }),
  previousStartAt: timestamp("previous_start_at", { withTimezone: true, mode: "string" }),
  previousEndAt: timestamp("previous_end_at", { withTimezone: true, mode: "string" }),
  newStartAt: timestamp("new_start_at", { withTimezone: true, mode: "string" }),
  newEndAt: timestamp("new_end_at", { withTimezone: true, mode: "string" }),
  action: text("action").notNull(),
  reason: text("reason").notNull().default(""),
  depositDisposition: text("deposit_disposition").notNull().default("NOT_APPLICABLE"),
  changedBy: text("changed_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("appointment_history_appointment_idx").on(table.appointmentId, table.createdAt)]);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => tattooRequests.id, { onDelete: "restrict" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "restrict" }),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
  totalCents: integer("total_cents").notNull().default(0),
  depositRequiredCents: integer("deposit_required_cents").notNull().default(0),
  paidCents: integer("paid_cents").notNull().default(0),
  status: text("status").notNull().default("PENDING"),
  paymentMethod: text("payment_method").notNull().default(""),
  externalReference: text("external_reference").notNull().default(""),
  dueAt: timestamp("due_at", { withTimezone: true, mode: "string" }),
  reportedAt: timestamp("reported_at", { withTimezone: true, mode: "string" }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: "string" }),
  confirmedBy: text("confirmed_by").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("payments_status_idx").on(table.status), index("payments_request_idx").on(table.requestId)]);

export const paymentTransactions = pgTable("payment_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id").notNull().references(() => payments.id, { onDelete: "restrict" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "restrict" }),
  requestId: uuid("request_id").notNull().references(() => tattooRequests.id, { onDelete: "restrict" }),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
  type: text("type").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull(),
  paymentMethod: text("payment_method").notNull().default(""),
  externalReference: text("external_reference").notNull().default(""),
  notes: text("notes").notNull().default(""),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: "string" }),
  confirmedBy: text("confirmed_by").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("payment_transactions_payment_idx").on(table.paymentId, table.createdAt)]);

export const internalNotes = pgTable("internal_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "restrict" }),
  requestId: uuid("request_id").references(() => tattooRequests.id, { onDelete: "restrict" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "restrict" }),
  content: text("content").notNull(),
  author: text("author").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("internal_notes_request_idx").on(table.requestId, table.createdAt)]);

export const timelineEvents = pgTable("timeline_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "restrict" }),
  requestId: uuid("request_id").references(() => tattooRequests.id, { onDelete: "restrict" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "restrict" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull().default(""),
  actor: text("actor").notNull().default("Sistema"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("timeline_events_request_idx").on(table.requestId, table.createdAt), index("timeline_events_appointment_idx").on(table.appointmentId, table.createdAt)]);

export const emailLogs = pgTable("email_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "restrict" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "restrict" }),
  requestId: uuid("request_id").references(() => tattooRequests.id, { onDelete: "restrict" }),
  recipient: text("recipient").notNull(),
  template: text("template").notNull(),
  subject: text("subject").notNull(),
  provider: text("provider").notNull().default("BREVO"),
  providerMessageId: text("provider_message_id"),
  status: text("status").notNull().default("QUEUED"),
  error: text("error").notNull().default(""),
  idempotencyKey: text("idempotency_key").unique(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  attemptCount: integer("attempt_count").notNull().default(0),
  sentAt: timestamp("sent_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("email_logs_request_idx").on(table.requestId, table.createdAt), index("email_logs_status_idx").on(table.status)]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userEmail: text("user_email").notNull().default("Sistema"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("audit_logs_entity_idx").on(table.entityType, table.entityId, table.createdAt)]);

export const studioSettings = pgTable("studio_settings", {
  id: text("id").primaryKey().default("default"),
  timezone: text("timezone").notNull().default("America/Mexico_City"),
  defaultDurationMinutes: integer("default_duration_minutes").notNull().default(120),
  bufferMinutes: integer("buffer_minutes").notNull().default(30),
  depositDueHours: integer("deposit_due_hours").notNull().default(24),
  holdHours: integer("hold_hours").notNull().default(24),
  depositType: text("deposit_type").notNull().default("FIXED"),
  depositValue: integer("deposit_value").notNull().default(50000),
  paymentInstructions: text("payment_instructions").notNull().default(""),
  transferBank: text("transfer_bank").notNull().default(""),
  transferBeneficiary: text("transfer_beneficiary").notNull().default(""),
  transferClabe: text("transfer_clabe").notNull().default(""),
  transferAccount: text("transfer_account").notNull().default(""),
  acceptedPaymentMethods: jsonb("accepted_payment_methods").$type<string[]>().notNull().default([]),
  notificationSettings: jsonb("notification_settings").$type<Record<string, boolean>>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
