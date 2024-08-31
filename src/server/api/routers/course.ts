import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { courses } from "~/server/db/schema";

// Define the tRPC router for courses
export const courseRouter = createTRPCRouter({
  // Create a new course (protected route)
  create: protectedProcedure
    .input(
      z.object({
        courseCode: z.string().min(1).max(64),
        courseName: z.string().min(1).max(255),
        semester: z.string().min(1).max(255),
        credit: z.number().min(0),
        description: z.string().optional(),
        assessments: z.any().optional(), // Adjust according to the structure of assessments
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(courses).values({
        courseCode: input.courseCode,
        courseName: input.courseName,
        semester: input.semester,
        credit: input.credit,
        description: input.description,
        assessments: input.assessments,
        createdBy: ctx.session.user.id, // Assuming user ID is stored in session
      });
    }),

  // Get the latest course (public route)
  getLatest: publicProcedure.query(async ({ ctx }) => {
    const latestCourse = await ctx.db.query.courses.findFirst({
      orderBy: (courses, { desc }) => [desc(courses.createdAt)],
    });

    return latestCourse ?? null;
  }),

  // Update an existing course by ID (protected route)
//   update: protectedProcedure
//     .input(
//       z.object({
//         id: z.string().uuid(),
//         courseCode: z.string().max(64).optional(),
//         courseName: z.string().max(255).optional(),
//         semester: z.string().max(255).optional(),
//         credit: z.number().optional(),
//         description: z.string().optional(),
//         assessments: z.any().optional(),
//       })
//     )
//     .mutation(async ({ ctx, input }) => {
//       const { id, ...data } = input;
//       await ctx.db
//         .update(courses)
//         .set(data)
//         .where("id", "=", id)
//         .execute(); // Adjust this according to your query builder or ORM
//     }),

  // Delete a course by ID (protected route)
//   delete: protectedProcedure
//     .input(z.object({ id: z.string().uuid() }))
//     .mutation(async ({ ctx, input }) => {
//       await ctx.db.delete().from(courses).where("id", "=", input.id).execute(); // Adjust this according to your query builder or ORM
//     }),
});
