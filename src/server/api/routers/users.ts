import { and, eq, isNull, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { userAssessments, enrollments } from "~/server/db/schema";
import { Context } from "~/trpc/server";
import { validateAssessmentsWeight } from "~/server/utils/validateAssessmentsWeight";

// Shared input schema for fields common to both create and update
export const assessmentFieldsSchema = z.object({
  enrollmentId: z.string().uuid(),
  assignmentName: z.string(),
  weight: z.number(),
  mark: z.number().optional(),
  maxMark: z.number().optional(),
});

const createAssessmentInputSchema = assessmentFieldsSchema;

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

  const deletedAssessments = await ctx.db
    .update(userAssessments)
    .set({ deletedAt: new Date() })
    .where(inArray(userAssessments.id, assessmentIdsToArchive))
    .returning();
  return deletedAssessments;
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
  createUserEnrollment: protectedProcedure
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
      if (!input.id) {
        throw Error("assessment id required for update");
      }
      if (input.weight) {
        const enrollmentId = (
          await ctx.db.query.userAssessments.findFirst({
            where: eq(userAssessments.id, input.id),
            columns: { enrollmentId: true },
          })
        )?.enrollmentId!;
        // get other assessments under same enrollments except self
        const existingAssessmentWeights = (
          await ctx.db
            .select({ weight: userAssessments.weight })
            .from(userAssessments)
            .where(
              and(
                eq(userAssessments.enrollmentId, enrollmentId),
                ne(userAssessments.id, input.id),
              ),
            )
        ).map((a) => a.weight);

        const isValidWeightInput = validateAssessmentsWeight(
          existingAssessmentWeights,
          [input.weight],
        );
        if (!isValidWeightInput) {
          throw Error(`Total weight after update will be greater than 100%.`);
        }
      }
      const updatedUserAssessment = await ctx.db
        .update(userAssessments)
        .set({
          ...input,
        })
        .where(eq(userAssessments.id, input.id))
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
          isNull(enrollments.deletedAt),
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
