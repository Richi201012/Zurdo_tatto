CREATE TABLE "artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artists_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "portfolio_images" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_item_id" text NOT NULL,
	"image_url" text NOT NULL,
	"optimized_url" text,
	"thumbnail_url" text,
	"alt" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"style_id" text NOT NULL,
	"artist_id" uuid,
	"artist_name" text DEFAULT '' NOT NULL,
	"body_placement" text DEFAULT '' NOT NULL,
	"size" text DEFAULT '' NOT NULL,
	"color_type" text DEFAULT 'black-and-grey' NOT NULL,
	"performed_at" timestamp with time zone,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "portfolio_items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tattoo_request_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tattoo_request_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tattoo_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"whatsapp" text NOT NULL,
	"email" text NOT NULL,
	"idea" text NOT NULL,
	"body_placement" text NOT NULL,
	"approximate_size" text NOT NULL,
	"color_preference" text NOT NULL,
	"preferred_day" text NOT NULL,
	"preferred_time" text NOT NULL,
	"reference_portfolio_item_id" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tattoo_styles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tattoo_styles_name_unique" UNIQUE("name"),
	CONSTRAINT "tattoo_styles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "portfolio_images" ADD CONSTRAINT "portfolio_images_portfolio_item_id_portfolio_items_id_fk" FOREIGN KEY ("portfolio_item_id") REFERENCES "public"."portfolio_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_style_id_tattoo_styles_id_fk" FOREIGN KEY ("style_id") REFERENCES "public"."tattoo_styles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tattoo_request_images" ADD CONSTRAINT "tattoo_request_images_tattoo_request_id_tattoo_requests_id_fk" FOREIGN KEY ("tattoo_request_id") REFERENCES "public"."tattoo_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tattoo_requests" ADD CONSTRAINT "tattoo_requests_reference_portfolio_item_id_portfolio_items_id_fk" FOREIGN KEY ("reference_portfolio_item_id") REFERENCES "public"."portfolio_items"("id") ON DELETE set null ON UPDATE no action;