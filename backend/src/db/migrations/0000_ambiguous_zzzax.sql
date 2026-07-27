CREATE TABLE "links" (
	"id" serial PRIMARY KEY NOT NULL,
	"short_code" varchar(32) NOT NULL,
	"stats_token" varchar(32) NOT NULL,
	"original_url" text NOT NULL,
	"is_custom_alias" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "links_short_code_unique" UNIQUE("short_code"),
	CONSTRAINT "links_stats_token_unique" UNIQUE("stats_token")
);
