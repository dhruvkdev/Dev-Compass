CREATE TYPE "public"."contextType" AS ENUM('dsa_roadmap', 'cp_strategy', 'dev_suggestion', 'global_summary');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('leetcode', 'codeforces', 'codechef', 'github', 'geeksforgeeks', 'atcoder', 'hackerrank', 'hackerearth');--> statement-breakpoint
CREATE TABLE "ai_insights" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"platform" "platform",
	"contextType" "contextType" NOT NULL,
	"insights" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"platform" "platform" NOT NULL,
	"rawData" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_handles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"platform" "platform" NOT NULL,
	"handle" text NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_snapshots" ADD CONSTRAINT "daily_snapshots_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_handles" ADD CONSTRAINT "platform_handles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_platform_date_idx" ON "daily_snapshots" USING btree ("user_id","platform","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_id_platform_unique" ON "platform_handles" USING btree ("user_id","platform");