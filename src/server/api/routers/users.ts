import { and, eq, isNull, inArray } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { userAssessments, enrollments, courses } from "~/server/db/schema";
import { Context } from "~/trpc/server";

// Shared input schema for fields common to both create and update
const assessmentFieldsSchema = z.object({
  enrollmentId: z.string().uuid(),
  assignmentName: z.string(),
  weight: z.number(),
  mark: z.number().optional(),
  maxMark: z.number().optional(),
});

// Create a full input schema for creating a new assessment
const createAssessmentInputSchema = assessmentFieldsSchema;

// Create a partial input schema for updating an existing assessment
const updateAssessmentInputSchema = assessmentFieldsSchema
  .extend({
    id: z.string().uuid(),
  })
  .partial({
    enrollmentId: true,
    assignmentName: true,
    weight: true,
    mark: true,
    maxMark: true,
  });

const prepareAssessmentData = (
  input: z.infer<typeof assessmentFieldsSchema>,
) => {
  const { enrollmentId, assignmentName, weight, mark, maxMark } = input;
  return {
    enrollmentId,
    assignmentName,
    weight,
    mark,
    maxMark,
  };
};

const getAssessmentsByEnrollment = async (
  ctx: Context,
  enrollmentId: string,
) => {
  console.log("Get user assessments by enrollment");

  // Query to find user assessments by enrollmentId
  const userAssessments = await ctx.db.query.userAssessments.findMany({
    where: (userAssessment, { eq }) =>
      and(
        eq(userAssessment.enrollmentId, enrollmentId),
        isNull(userAssessment.deletedAt),
      ),
  });

  return userAssessments.length > 0 ? userAssessments : null;
};
const deleteAssessments = async (ctx: Context, assessmentIds: string[]) => {
  // Fetch assessments linked to the enrollment
  const assessmentIdsToArchive = (
    await ctx.db
      .select({ id: userAssessments.id })
      .from(userAssessments)
      .where(
        and(
          inArray(userAssessments.id, assessmentIds),
          isNull(userAssessments.deletedAt),
        ),
      )
  ).map((assessment) => assessment.id);

  if (assessmentIdsToArchive.length === 0) {
    throw new Error(
      `No assessments found from [${assessmentIds}] or they have already been deleted.`,
    );
  }

  if (assessmentIdsToArchive.length < assessmentIds.length) {
    const missingIdsForDeletion = assessmentIds.filter(
      (a) => assessmentIdsToArchive.indexOf(a) < 0,
    );
    console.warn(
      `Assessments [${missingIdsForDeletion}] not found or they have already been deleted`,
    );
  }
  // Update the `deletedAt` field for the assessments
  const deletedAssessments = await ctx.db
    .update(userAssessments)
    .set({ deletedAt: new Date() }) // Set the current timestamp
    .where(inArray(userAssessments.id, assessmentIdsToArchive))
    .returning();
  return deletedAssessments;
  //console.log(`Assessments for enrollment ${enrollmentId} have been marked as deleted.`);
};

export const userRouter = createTRPCRouter({
  getUserEnrollments: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id || input.userId!;
      const userEnrollments = ctx.db.query.enrollments.findMany({
        where: (enrollments, { eq }) =>
          and(eq(enrollments.userId, userId), isNull(enrollments.deletedAt)),
        with: {
          assessments: true,
        },
      });
      return userEnrollments ?? null;
    }),
  getUserAssessmentsByEnrollment: protectedProcedure
    .input(z.object({ enrollmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await getAssessmentsByEnrollment(ctx, input.enrollmentId);
    }),
  createUserEnrollments: protectedProcedure
    .input(z.object({ courseId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userEnrollments = ctx.db
        .insert(enrollments)
        .values({
          userId,
          courseId: input.courseId,
        })
        .returning();
      return userEnrollments ?? null;
    }),
  createUserAssessments: protectedProcedure
    .input(z.array(createAssessmentInputSchema))
    .mutation(async ({ ctx, input }) => {
      // TODO: add validation to check weights combine should be no more than 1
      let assessmentsToBeInserted: z.infer<
        typeof createAssessmentInputSchema
      >[] = [];
      input.forEach((assessment) => {
        const data = prepareAssessmentData(assessment);
        assessmentsToBeInserted.push(data);
      });

      const userAssessment = ctx.db
        .insert(userAssessments)
        .values(assessmentsToBeInserted)
        .returning();

      return userAssessment ?? null;
    }),
  updateUserAssessment: protectedProcedure
    .input(updateAssessmentInputSchema)
    .mutation(async ({ ctx, input }) => {
      // TODO: validate after update the combine weight is <= 1
      if (!input.id) {
        throw Error("assessment id required for update");
      }
      const userId = ctx.session.user.id; // Ensure that the user is authenticated
      // Update the user assessment in the database
      const updatedUserAssessment = await ctx.db
        .update(userAssessments)
        .set({
          ...input, // Use the helper function
        })
        .where(
          eq(userAssessments.enrollmentId, userId) &&
            eq(userAssessments.id, input.id),
        )
        .returning();

      return updatedUserAssessment ?? null;
    }),
  deleteUserEnrollment: protectedProcedure
    .input(z.object({ enrollmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { enrollmentId } = input;
      const existingEnrollment = await ctx.db.query.enrollments.findFirst({
        where: and(
          eq(enrollments.id, enrollmentId),
          isNull(enrollments.deletedAt), // Check that `deletedAt` is null
        ),
      });
      if (!existingEnrollment) {
        throw Error(
          `Enrollment ${enrollmentId} does not exist or has already been deleted.`,
        );
      }

      const assessmentsIdsToBeDeleted = (
        await getAssessmentsByEnrollment(ctx, input.enrollmentId)
      )?.map((a) => a.id);
      const deletedAssessments = await deleteAssessments(
        ctx,
        assessmentsIdsToBeDeleted || [],
      );
      console.debug(
        `Assessments ${deletedAssessments} associated with enrollmentId ${input.enrollmentId} have been deleted`,
      );
      const deletedEnrollment = await ctx.db
        .update(enrollments)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(eq(enrollments.id, enrollmentId), eq(enrollments.userId, userId)),
        )
        .returning();
      if (!deletedEnrollment) {
        throw Error(`User enrollment ${input.enrollmentId} does not exist`);
      }

      return deletedEnrollment ?? null;
    }),
  deleteUserAssessments: protectedProcedure
    .input(z.object({ assessmentIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      return await deleteAssessments(ctx, input.assessmentIds);
    }),
});
