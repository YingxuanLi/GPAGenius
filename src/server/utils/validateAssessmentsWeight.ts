/**
 *
 * @param existingAssessmentWeights
 * @param newAssessmentWeights
 * @returns true if valid
 */
export const validateAssessmentsWeight = (
  existingAssessmentWeights: number[],
  newAssessmentWeights: number[],
): Boolean => {
  const currentTotalWeight = existingAssessmentWeights.reduce(
    (total, assessmentWeight) => total + assessmentWeight,
    0,
  );

  const newAssessmentsTotalWeight = newAssessmentWeights.reduce(
    (total, assessmentWeight) => total + assessmentWeight,
    0,
  );

  const combinedTotalWeight = currentTotalWeight + newAssessmentsTotalWeight;

  if (combinedTotalWeight > 1) {
    throw Error(
      `The total weight of assessments cannot exceed 1. Current total weight is ${currentTotalWeight}, and new assessments adds ${newAssessmentsTotalWeight}.`,
    );
  }

  return true;
};
