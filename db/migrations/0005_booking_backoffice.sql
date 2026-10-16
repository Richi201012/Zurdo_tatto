CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "role" text DEFAULT 'RECEPTION' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "whatsapp" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clients_name_idx" ON "clients" ("name");
CREATE INDEX IF NOT EXISTS "clients_whatsapp_idx" ON "clients" ("whatsapp");
--> statement-breakpoint
INSERT INTO "clients" ("name", "email", "whatsapp", "created_at", "updated_at")
SELECT DISTINCT ON (lower("email")) "name", lower("email"), "whatsapp", "created_at", "updated_at"
FROM "tattoo_requests"
ORDER BY lower("email"), "created_at"
ON CONFLICT ("email") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "tattoo_requests" ADD COLUMN IF NOT EXISTS "folio" text;
ALTER TABLE "tattoo_requests" ADD COLUMN IF NOT EXISTS "client_id" uuid;
ALTER TABLE "tattoo_requests" ADD COLUMN IF NOT EXISTS "style" text DEFAULT '' NOT NULL;
ALTER TABLE "tattoo_requests" ADD COLUMN IF NOT EXISTS "artist_id" uuid;
ALTER TABLE "tattoo_requests" ADD COLUMN IF NOT EXISTS "next_action" text DEFAULT 'Revisar solicitud' NOT NULL;
ALTER TABLE "tattoo_requests" ADD COLUMN IF NOT EXISTS "last_interaction_at" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "tattoo_requests" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "tattoo_requests" r SET "client_id" = c."id" FROM "clients" c WHERE lower(r."email") = c."email" AND r."client_id" IS NULL;
--> statement-breakpoint
WITH ranked AS (
  SELECT "id", EXTRACT(YEAR FROM "created_at")::int AS year_value,
    row_number() OVER (PARTITION BY EXTRACT(YEAR FROM "created_at") ORDER BY "created_at", "id") AS number_value
  FROM "tattoo_requests" WHERE "folio" IS NULL
)
UPDATE "tattoo_requests" r
SET "folio" = 'SOL-' || ranked.year_value || '-' || lpad(ranked.number_value::text, 5, '0')
FROM ranked WHERE r."id" = ranked."id";
--> statement-breakpoint
UPDATE "tattoo_requests" SET "status" = 'NEW_REQUEST' WHERE "status" = 'new';
--> statement-breakpoint
ALTER TABLE "tattoo_requests" ALTER COLUMN "folio" SET NOT NULL;
ALTER TABLE "tattoo_requests" ALTER COLUMN "client_id" SET NOT NULL;
ALTER TABLE "tattoo_requests" ALTER COLUMN "status" SET DEFAULT 'NEW_REQUEST';
DO $$ BEGIN
  ALTER TABLE "tattoo_requests" ADD CONSTRAINT "tattoo_requests_folio_unique" UNIQUE("folio");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tattoo_requests" ADD CONSTRAINT "tattoo_requests_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE restrict;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "tattoo_requests" ADD CONSTRAINT "tattoo_requests_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "tattoo_requests_client_idx" ON "tattoo_requests" ("client_id");
CREATE INDEX IF NOT EXISTS "tattoo_requests_artist_idx" ON "tattoo_requests" ("artist_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL REFERENCES "tattoo_requests"("id") ON DELETE restrict,
  "min_price_cents" integer DEFAULT 0 NOT NULL,
  "max_price_cents" integer DEFAULT 0 NOT NULL,
  "deposit_required_cents" integer DEFAULT 0 NOT NULL,
  "estimated_minutes" integer DEFAULT 120 NOT NULL,
  "session_count" integer DEFAULT 1 NOT NULL,
  "artist_id" uuid REFERENCES "artists"("id") ON DELETE set null,
  "comments" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'DRAFT' NOT NULL,
  "sent_at" timestamp with time zone,
  "created_by" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "quotes_request_idx" ON "quotes" ("request_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "availability_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "artist_id" uuid NOT NULL REFERENCES "artists"("id") ON DELETE cascade,
  "weekday" integer NOT NULL,
  "start_time" time NOT NULL,
  "end_time" time NOT NULL,
  "break_start_time" time,
  "break_end_time" time,
  "minimum_minutes" integer DEFAULT 60 NOT NULL,
  "buffer_minutes" integer DEFAULT 30 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "availability_rules_artist_weekday_idx" UNIQUE("artist_id", "weekday")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "availability_exceptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "artist_id" uuid NOT NULL REFERENCES "artists"("id") ON DELETE cascade,
  "date" date NOT NULL,
  "start_time" time,
  "end_time" time,
  "kind" text DEFAULT 'BLOCKED' NOT NULL,
  "reason" text DEFAULT '' NOT NULL,
  "created_by" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "availability_exceptions_artist_date_idx" ON "availability_exceptions" ("artist_id", "date");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "availability_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL REFERENCES "tattoo_requests"("id") ON DELETE cascade,
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "availability_offers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL REFERENCES "tattoo_requests"("id") ON DELETE cascade,
  "token_id" uuid NOT NULL REFERENCES "availability_tokens"("id") ON DELETE cascade,
  "artist_id" uuid NOT NULL REFERENCES "artists"("id") ON DELETE restrict,
  "start_at" timestamp with time zone NOT NULL,
  "end_at" timestamp with time zone NOT NULL,
  "status" text DEFAULT 'HELD' NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "selected_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "availability_offers_artist_time_idx" ON "availability_offers" ("artist_id", "start_at", "end_at");
CREATE INDEX IF NOT EXISTS "availability_offers_request_idx" ON "availability_offers" ("request_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "appointments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "folio" text NOT NULL UNIQUE,
  "request_id" uuid NOT NULL UNIQUE REFERENCES "tattoo_requests"("id") ON DELETE restrict,
  "client_id" uuid NOT NULL REFERENCES "clients"("id") ON DELETE restrict,
  "artist_id" uuid NOT NULL REFERENCES "artists"("id") ON DELETE restrict,
  "start_at" timestamp with time zone NOT NULL,
  "end_at" timestamp with time zone NOT NULL,
  "status" text DEFAULT 'TENTATIVE' NOT NULL,
  "summary" text DEFAULT '' NOT NULL,
  "location" text DEFAULT '' NOT NULL,
  "reminder_48h_sent_at" timestamp with time zone,
  "reminder_24h_sent_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "appointments_artist_start_idx" ON "appointments" ("artist_id", "start_at");
CREATE INDEX IF NOT EXISTS "appointments_status_start_idx" ON "appointments" ("status", "start_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "appointment_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "appointment_id" uuid NOT NULL REFERENCES "appointments"("id") ON DELETE restrict,
  "previous_start_at" timestamp with time zone,
  "previous_end_at" timestamp with time zone,
  "new_start_at" timestamp with time zone,
  "new_end_at" timestamp with time zone,
  "action" text NOT NULL,
  "reason" text DEFAULT '' NOT NULL,
  "deposit_disposition" text DEFAULT 'NOT_APPLICABLE' NOT NULL,
  "changed_by" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "appointment_history_appointment_idx" ON "appointment_history" ("appointment_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL REFERENCES "tattoo_requests"("id") ON DELETE restrict,
  "appointment_id" uuid REFERENCES "appointments"("id") ON DELETE restrict,
  "client_id" uuid NOT NULL REFERENCES "clients"("id") ON DELETE restrict,
  "total_cents" integer DEFAULT 0 NOT NULL,
  "deposit_required_cents" integer DEFAULT 0 NOT NULL,
  "paid_cents" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'PENDING' NOT NULL,
  "payment_method" text DEFAULT '' NOT NULL,
  "external_reference" text DEFAULT '' NOT NULL,
  "due_at" timestamp with time zone,
  "reported_at" timestamp with time zone,
  "confirmed_at" timestamp with time zone,
  "confirmed_by" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments" ("status");
CREATE INDEX IF NOT EXISTS "payments_request_idx" ON "payments" ("request_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "payment_id" uuid NOT NULL REFERENCES "payments"("id") ON DELETE restrict,
  "appointment_id" uuid REFERENCES "appointments"("id") ON DELETE restrict,
  "request_id" uuid NOT NULL REFERENCES "tattoo_requests"("id") ON DELETE restrict,
  "client_id" uuid NOT NULL REFERENCES "clients"("id") ON DELETE restrict,
  "type" text NOT NULL,
  "amount_cents" integer NOT NULL,
  "status" text NOT NULL,
  "payment_method" text DEFAULT '' NOT NULL,
  "external_reference" text DEFAULT '' NOT NULL,
  "notes" text DEFAULT '' NOT NULL,
  "idempotency_key" text NOT NULL UNIQUE,
  "confirmed_at" timestamp with time zone,
  "confirmed_by" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "payment_transactions_payment_idx" ON "payment_transactions" ("payment_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "internal_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid REFERENCES "clients"("id") ON DELETE restrict,
  "request_id" uuid REFERENCES "tattoo_requests"("id") ON DELETE restrict,
  "appointment_id" uuid REFERENCES "appointments"("id") ON DELETE restrict,
  "content" text NOT NULL,
  "author" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "internal_notes_request_idx" ON "internal_notes" ("request_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "timeline_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid REFERENCES "clients"("id") ON DELETE restrict,
  "request_id" uuid REFERENCES "tattoo_requests"("id") ON DELETE restrict,
  "appointment_id" uuid REFERENCES "appointments"("id") ON DELETE restrict,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "detail" text DEFAULT '' NOT NULL,
  "actor" text DEFAULT 'Sistema' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "timeline_events_request_idx" ON "timeline_events" ("request_id", "created_at");
CREATE INDEX IF NOT EXISTS "timeline_events_appointment_idx" ON "timeline_events" ("appointment_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid REFERENCES "clients"("id") ON DELETE restrict,
  "appointment_id" uuid REFERENCES "appointments"("id") ON DELETE restrict,
  "request_id" uuid REFERENCES "tattoo_requests"("id") ON DELETE restrict,
  "recipient" text NOT NULL,
  "template" text NOT NULL,
  "subject" text NOT NULL,
  "provider" text DEFAULT 'BREVO' NOT NULL,
  "provider_message_id" text,
  "status" text DEFAULT 'QUEUED' NOT NULL,
  "error" text DEFAULT '' NOT NULL,
  "idempotency_key" text UNIQUE,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "sent_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "email_logs_request_idx" ON "email_logs" ("request_id", "created_at");
CREATE INDEX IF NOT EXISTS "email_logs_status_idx" ON "email_logs" ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_email" text DEFAULT 'Sistema' NOT NULL,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" ("entity_type", "entity_id", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "studio_settings" (
  "id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
  "timezone" text DEFAULT 'America/Mexico_City' NOT NULL,
  "default_duration_minutes" integer DEFAULT 120 NOT NULL,
  "buffer_minutes" integer DEFAULT 30 NOT NULL,
  "deposit_due_hours" integer DEFAULT 24 NOT NULL,
  "hold_hours" integer DEFAULT 24 NOT NULL,
  "deposit_type" text DEFAULT 'FIXED' NOT NULL,
  "deposit_value" integer DEFAULT 50000 NOT NULL,
  "payment_instructions" text DEFAULT '' NOT NULL,
  "accepted_payment_methods" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "notification_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
INSERT INTO "studio_settings" ("id") VALUES ('default') ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "timeline_events" ("client_id", "request_id", "type", "title", "detail", "actor", "created_at")
SELECT "client_id", "id", 'REQUEST_RECEIVED', 'Solicitud recibida', 'Registro migrado al centro de operaciones.', 'Sistema', "created_at"
FROM "tattoo_requests"
WHERE NOT EXISTS (SELECT 1 FROM "timeline_events" e WHERE e."request_id" = "tattoo_requests"."id" AND e."type" = 'REQUEST_RECEIVED');
