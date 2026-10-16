UPDATE "portfolio_items"
SET
  "title" = 'Cover up: manos y rosario',
  "slug" = 'cover-up-manos-y-rosario-8167',
  "description" = 'Cover up realizado sobre un tatuaje existente. La nueva composición de manos y rosario transforma la pieza original con mayor profundidad, detalle y contraste.',
  "updated_at" = NOW()
WHERE "id" = 'work-8167';
--> statement-breakpoint
UPDATE "portfolio_images"
SET
  "id" = 'work-8167-before',
  "alt" = 'Antes del cover up: tatuaje original de manos en oración',
  "sort_order" = 0,
  "is_cover" = false
WHERE "id" = 'work-8167-cover';
--> statement-breakpoint
UPDATE "portfolio_images"
SET
  "id" = 'work-8167-after',
  "portfolio_item_id" = 'work-8167',
  "alt" = 'Después del cover up: manos en oración con rosario',
  "sort_order" = 1,
  "is_cover" = true
WHERE "id" = 'work-8168-cover';
--> statement-breakpoint
DELETE FROM "portfolio_items" WHERE "id" = 'work-8168';
