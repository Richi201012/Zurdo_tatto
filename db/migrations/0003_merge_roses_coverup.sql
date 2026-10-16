UPDATE "portfolio_items"
SET
  "title" = 'Cover up: rosas a color',
  "slug" = 'cover-up-rosas-a-color-8142',
  "description" = 'Cover up realizado sobre un tatuaje existente. La composición floral a color cubre la pieza original y transforma por completo el costado.',
  "style_id" = 'Color',
  "color_type" = 'color',
  "tags" = '["Color", "Costado"]'::jsonb,
  "updated_at" = NOW()
WHERE "id" = 'work-8142';
--> statement-breakpoint
UPDATE "portfolio_images"
SET
  "id" = 'work-8142-before',
  "alt" = 'Antes del cover up: tatuaje pequeño de arma',
  "sort_order" = 0,
  "is_cover" = false
WHERE "id" = 'work-8142-cover';
--> statement-breakpoint
UPDATE "portfolio_images"
SET
  "id" = 'work-8142-after',
  "portfolio_item_id" = 'work-8142',
  "alt" = 'Después del cover up: composición de rosas a color',
  "sort_order" = 1,
  "is_cover" = true
WHERE "id" = 'work-8124-cover';
--> statement-breakpoint
DELETE FROM "portfolio_items" WHERE "id" = 'work-8124';
