ALTER TABLE "gpa-genius_course" RENAME COLUMN "assignemnts" TO "assessments";--> statement-breakpoint
ALTER TABLE "gpa-genius_course" ALTER COLUMN "course_code" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "gpa-genius_course" ALTER COLUMN "course_name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "gpa-genius_course" ALTER COLUMN "semester" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "gpa-genius_course" ADD COLUMN "credit" real NOT NULL;