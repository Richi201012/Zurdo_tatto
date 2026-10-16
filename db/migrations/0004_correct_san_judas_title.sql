UPDATE "portfolio_items"
SET
  "title" = 'San Judas Tadeo',
  "slug" = 'san-judas-tadeo-8129',
  "updated_at" = NOW()
WHERE "id" = 'work-8129';
--> statement-breakpoint
UPDATE "portfolio_images"
SET "alt" = 'San Judas Tadeo, tatuaje realista en antebrazo'
WHERE "portfolio_item_id" = 'work-8129';
