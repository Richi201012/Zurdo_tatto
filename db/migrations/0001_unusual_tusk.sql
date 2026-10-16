CREATE INDEX "portfolio_images_item_order_idx" ON "portfolio_images" USING btree ("portfolio_item_id","sort_order");--> statement-breakpoint
CREATE INDEX "portfolio_items_public_idx" ON "portfolio_items" USING btree ("is_published","deleted_at","sort_order");--> statement-breakpoint
CREATE INDEX "portfolio_items_style_idx" ON "portfolio_items" USING btree ("style_id");--> statement-breakpoint
CREATE INDEX "tattoo_requests_status_created_idx" ON "tattoo_requests" USING btree ("status","created_at");