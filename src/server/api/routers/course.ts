import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { courses } from "~/server/db/schema";
import { getCourseAndAssessments } from "~/server/utils/courseScraper";

//@ts-ignore
const insertCourse = async ({ ctx, input }) => {
  // console.info(input)
  const course = await ctx.db
    .insert(courses)
    .values({
      courseCode: input.courseCode,
      courseName: input.courseName,
      year: input.year,
      semester: input.semester,
      credit: input.credit,
      university: input.university,
      description: input.description,
      assessments: input.assessments,
      createdBy: input.createdBy || ctx.session.user.id, // Assuming user ID is stored in session
    })
    .returning();
    console.info('create by', course.createdBy)
  return course;
};

// Define the tRPC router for courses
export const courseRouter = createTRPCRouter({
  // Create a new course (protected route)
  create: protectedProcedure
    .input(
      z.object({
        university: z.string(),
        courseCode: z.string().min(1).max(64),
        courseName: z.string().min(1).max(255),
        semester: z.string().min(1).max(255),
        year: z.number(),
        credit: z.number().min(0),
        description: z.string().optional(),
        assessments: z.any(), // Adjust according to the structure of assessments
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await insertCourse({ ctx, input });
    }),

  getCourseById: publicProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.db.query.courses.findFirst({
        where: (courses, { eq }) => eq(courses.id, input.courseId),
      });

      return course ?? null;
    }),

  getCourseByCodeAndSemester: publicProcedure
    .input(
      z.object({
        university: z.string(),
        courseCode: z.string(),
        year: z.number(),
        semester: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      let course = await ctx.db.query.courses.findFirst({
        where: (courses, { eq, and }) =>
          and(
            eq(courses.university, input.university),
            eq(courses.courseCode, input.courseCode),
            eq(courses.year, input.year),
            eq(courses.semester, input.semester),
          ),
      });
      if (!course) {
        //   await course.create
        const { courseName, courseCode, units, assessments } =
          await getCourseAndAssessments(
            input.courseCode,
            input.semester,
            input.year.toString(),
          );
        const formattedInput = {
          //TODO: refactor this to refer to university table in the future
          university: "UQ",
          courseCode,
          courseName,
          credit: units,
          assessments,
          year: input.year,
          semester: input.semester,
          createdBy: "system",
          updatedBy: "system",
        };
        course = await insertCourse({ ctx, input: formattedInput });
        // console.info('test', courseInserted)
      }
      return course ?? null;
    }),

});
