CREATE TABLE IF NOT EXISTS "gpa-genius_course" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_code" varchar(20) NOT NULL,
	"course_name" varchar NOT NULL,
	"description" text,
	"assignemnts" jsonb,
	"creted_by" varchar,
	"updated_by" varchar,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
