CREATE TABLE "clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"link_id" integer NOT NULL,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" varchar(45),
	"country" varchar(2),
	"region" varchar(120),
	"city" varchar(120),
	"browser" varchar(60),
	"browser_version" varchar(30),
	"os" varchar(60),
	"os_version" varchar(30),
	"device_type" varchar(20) DEFAULT 'desktop' NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"user_agent" text
);
--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clicks_link_id_idx" ON "clicks" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "clicks_clicked_at_idx" ON "clicks" USING btree ("clicked_at");