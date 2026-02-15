CREATE TYPE "public"."recommendation_category" AS ENUM('reinforcement', 'depth', 'maintenance', 'micro_collaboration');--> statement-breakpoint
CREATE TABLE "github_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"persona" text NOT NULL,
	"maturity" text NOT NULL,
	"focus_areas" jsonb NOT NULL,
	"strengths" jsonb NOT NULL,
	"gaps" jsonb NOT NULL,
	"axes" jsonb NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_profile_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"github_username" text NOT NULL,
	"repo_count" integer NOT NULL,
	"total_commits" integer NOT NULL,
	"languages" jsonb NOT NULL,
	"repos_metadata" jsonb NOT NULL,
	"contribution_stats" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"analysis_id" uuid NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"dismissed_at" timestamp,
	"completed_at" timestamp,
	"axis_targeted" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_analysis" ADD CONSTRAINT "github_analysis_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_analysis" ADD CONSTRAINT "github_analysis_snapshot_id_github_profile_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."github_profile_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_profile_snapshots" ADD CONSTRAINT "github_profile_snapshots_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_recommendations" ADD CONSTRAINT "github_recommendations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_recommendations" ADD CONSTRAINT "github_recommendations_analysis_id_github_analysis_id_fk" FOREIGN KEY ("analysis_id") REFERENCES "public"."github_analysis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "github_analysis_snapshot_unique" ON "github_analysis" USING btree ("user_id","snapshot_id");--> statement-breakpoint
CREATE INDEX "github_analysis_generated_idx" ON "github_analysis" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "github_snapshot_user_idx" ON "github_profile_snapshots" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "github_snapshot_created_idx" ON "github_profile_snapshots" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "github_reco_user_idx" ON "github_recommendations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "github_reco_analysis_idx" ON "github_recommendations" USING btree ("analysis_id");--> statement-breakpoint
CREATE INDEX "github_reco_category_idx" ON "github_recommendations" USING btree ("category");