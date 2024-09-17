import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

//TODO: separate type to a central place for easier assess
type RouterOutput = inferRouterOutputs<AppRouter>;
type Assessment =
  RouterOutput["user"]["getUserEnrollments"][0]["assessments"][0];
export const calculateRequiredMark = (
  assessments: Assessment[],
  targetPercentage: number,
): string | null => {
  const ungradedAssessments = assessments.filter(
    ({ mark }) => mark === null || mark === 0,
  );

  if (ungradedAssessments.length !== 1) return null;

  const currentWeightedScore = assessments.reduce(
    (total, { mark, weight }) => total + (mark || 0) * weight,
    0,
  );

  const remainingWeight = assessments.reduce(
    (total, { weight, mark }) =>
      mark === 0 || mark == null ? total + weight : total,
    0,
  );

  if (remainingWeight <= 0) return null;

  const requiredMark =
    (targetPercentage - currentWeightedScore) / remainingWeight;
  if (requiredMark > 100) {
    return ">100";
  }
  return requiredMark.toFixed(2);
};
