CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
ALTER TABLE "user_recommended_problems" ALTER COLUMN "problem_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "external_id" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "platform_external_id_unique" ON "problems" USING btree ("platform","external_id");