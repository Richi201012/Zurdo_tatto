ALTER TABLE "studio_settings" ADD COLUMN IF NOT EXISTS "transfer_bank" text DEFAULT '' NOT NULL;
ALTER TABLE "studio_settings" ADD COLUMN IF NOT EXISTS "transfer_beneficiary" text DEFAULT '' NOT NULL;
ALTER TABLE "studio_settings" ADD COLUMN IF NOT EXISTS "transfer_clabe" text DEFAULT '' NOT NULL;
ALTER TABLE "studio_settings" ADD COLUMN IF NOT EXISTS "transfer_account" text DEFAULT '' NOT NULL;
UPDATE "studio_settings" SET "deposit_due_hours" = 2, "hold_hours" = 2 WHERE "id" = 'default';
