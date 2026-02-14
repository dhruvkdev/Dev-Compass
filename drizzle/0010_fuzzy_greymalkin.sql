CREATE TABLE "user_leetcode_solved_problems" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"problem_slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_leetcode_solved_problems" ADD CONSTRAINT "user_leetcode_solved_problems_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_id_problem_slug_unique" ON "user_leetcode_solved_problems" USING btree ("user_id","problem_slug");