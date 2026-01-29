CREATE TABLE "holdings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"metal_type" text NOT NULL,
	"weight_oz" numeric(10, 4) NOT NULL,
	"form_type" text NOT NULL,
	"denomination" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"purchase_price_aud" numeric(10, 2),
	"purchase_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"daily_digest_enabled" boolean DEFAULT false NOT NULL,
	"discord_webhook_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "price_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metal_type" text NOT NULL,
	"price_aud" numeric(10, 2) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "price_cache_metal_type_unique" UNIQUE("metal_type")
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metal_type" text NOT NULL,
	"price_aud" numeric(10, 4) NOT NULL,
	"recorded_date" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "price_history_metal_type_recorded_date_unique" UNIQUE("metal_type","recorded_date")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;