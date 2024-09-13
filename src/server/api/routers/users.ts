import { and, eq, isNull, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { userAssessments, enrollments, courses } from "~/server/db/schema";
import { Context } from "~/trpc/server";
import { validateAssessmentsWeight } from "~/server/utils/validateAssessmentsWeight";
import { sql } from "drizzle-orm";

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
          course: true,
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
      const userEnrollment = (
        await ctx.db
          .insert(enrollments)
          .values({
            userId,
            courseId: input.courseId,
          })
          .returning()
      )[0];

      if (!userEnrollment) {
        throw new Error("Failed to enroll!");
      }
      // get course assessments
      const courseAssessments = (
        await ctx.db
          .select({ assessments: courses.assessments })
          .from(courses)
          .where(eq(courses.id, input.courseId))
      )[0]?.assessments as any;
      // map them to user assessments
      const parsePercentageToDecimal = (percentage: string) => {
        const decimal = parseFloat(percentage.replace("%", "")) / 100;
        return decimal;
      };

      courseAssessments.forEach(async (assessment: any) => {
        const assessmentInput = {
          enrollmentId: userEnrollment.id,
          weight: parsePercentageToDecimal(assessment.weight),
          assignmentName: assessment.title,
          mark: 0,
        };

        const assessments = await ctx.db
          .insert(userAssessments)
          .values(assessmentInput)
          .returning();
      });
      console.log(courseAssessments);
      return userEnrollment ?? null;
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
      if (!assessmentsIdsToBeDeleted) return;
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
  // assessment ranking
  getUserAssessmentRankingByCourse: protectedProcedure
    .input(z.object({ assessmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Query to calculate ranking of each user's assessments by courseId
      // TODO: Maybe redesign the way to get assignment, course assignment comes from jsonb which we can't tell assignment by id, 
      // thus we can only partition by assignment with course id
      // TODO: alternatively, we can store normalised rank in db and use a procedure to calculate, 
      // tho this will increase storage and insert cost
      const result = await ctx.db
        .select({
          enrollmentId: enrollments.id,
          assessmentId: userAssessments.id,
          assignmentName: userAssessments.assignmentName,
          courseId: courses.id,
          mark: userAssessments.mark,
          normalisedPercentRank: sql<number>`CASE 
          WHEN (COUNT(*) OVER (PARTITION BY ${userAssessments.assignmentName}, ${courses.id}) - 1) = 0 THEN 1
          ELSE (CAST((RANK() OVER (PARTITION BY ${userAssessments.assignmentName}, ${courses.id} ORDER BY ${userAssessments.mark}) - 1) AS FLOAT) /
          (COUNT(*) OVER (PARTITION BY ${courses.id}, ${userAssessments.assignmentName}) - 1))
        END`,
        })
        .from(userAssessments)
        .innerJoin(
          enrollments,
          eq(userAssessments.enrollmentId, enrollments.id),
        )
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(isNull(userAssessments.deletedAt))
        .orderBy(userAssessments.assignmentName);

      // Filter to get the specific assessmentId
      const assessment = result.find(
        (row) => row.assessmentId === input.assessmentId,
      );

      // Return the filtered result
      return {
        assessmentId: assessment?.assessmentId,
        percentRank: assessment?.normalisedPercentRank,
      };
    }),
  //TODO: remove mock enrollments for dev purpose
  // createMockEnrollments: protectedProcedure
  //   .input(z.object({ courseId: z.string().uuid() }))
  //   .mutation(async ({ ctx, input }) => {
  //     const userIds = [
  //       "a9be0421-ef99-4333-be32-1293097f80d8",
  //       "9624d0d4-0d6d-4204-a571-8708c8ed9274",
  //       "c506b451-397c-40e3-9bff-1c16acf73856",
  //       "b640e903-9fe5-402d-bec9-cf26baa53aab",
  //       "5af7a0f8-7251-4f88-a2b8-c278e5f6cb36",
  //       "584416d3-cca7-4e00-8e77-55a21acc9f2b",
  //       "2f3ead35-aac2-4e24-a1d5-9cbcba1ef356",
  //       "4b8c3aa6-ef18-4587-af5b-6aeb9fd255e9",
  //       "5722efcc-681a-4bde-98d6-88300e3827d2",
  //       "a93e602a-a7a3-4ae1-8a7e-9e87f4b36f01",
  //       "85d36a12-d3db-48d7-bda9-c63a65e4b9d2",
  //       "47630cf6-c676-4636-b581-1a2265193dff",
  //       "35cf45d4-cf38-4d77-8a63-650389989ac6",
  //       "487a1cfa-f0d7-4aab-b102-f2da3c61c3f2",
  //     ];
  //     const userEnrollments = userIds.map(async (u) => {
  //       const userEnrollment = (await ctx.db.insert(enrollments).values({
  //         userId: u,
  //         courseId: input.courseId,
  //       }).returning())[0];
  //       const courseAssessments = (
  //         await ctx.db
  //           .select({ assessments: courses.assessments })
  //           .from(courses)
  //           .where(eq(courses.id, input.courseId))
  //       )[0]?.assessments as any;
  //       // map them to user assessments
  //       const parsePercentageToDecimal = (percentage: string) => {
  //         const decimal = parseFloat(percentage.replace("%", "")) / 100;
  //         return decimal;
  //       };

  //       courseAssessments.forEach(async (assessment: any) => {
  //         const assessmentInput = {
  //           enrollmentId: userEnrollment?.id,
  //           weight: parsePercentageToDecimal(assessment.weight),
  //           assignmentName: assessment.title,
  //           mark: 0,
  //         };

  //         const assessments = await ctx.db
  //           .insert(userAssessments)
  //           .values(assessmentInput!)
  //           .returning();
  //       });
  //     });

  // if (!userEnrollment) {
  //   throw new Error("Failed to enroll!");
  // }
  // get course assessments
  // const courseAssessments = (
  //   await ctx.db
  //     .select({ assessments: courses.assessments })
  //     .from(courses)
  //     .where(eq(courses.id, input.courseId))
  // )[0]?.assessments as any;
  // // map them to user assessments
  // const parsePercentageToDecimal = (percentage: string) => {
  //   const decimal = parseFloat(percentage.replace("%", "")) / 100;
  //   return decimal;
  // };

  // courseAssessments.forEach(async (assessment: any) => {
  //   const assessmentInput = {
  //     enrollmentId: userEnrollment.id,
  //     weight: parsePercentageToDecimal(assessment.weight),
  //     assignmentName: assessment.title,
  //     mark: 0,
  //   };

  //   const assessments = await ctx.db
  //     .insert(userAssessments)
  //     .values(assessmentInput)
  //     .returning();
  // });
  // console.log(courseAssessments);
  // return userEnrollment ?? null;
  // }),
});
