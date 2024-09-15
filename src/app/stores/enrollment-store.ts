import { create } from "zustand";
import type {  inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from "~/server/api/root";

type RouterOutput = inferRouterOutputs<AppRouter>;
type UserEnrollments = RouterOutput['user']['getUserEnrollments'];

interface StoreState {
  enrollments: UserEnrollments;
  setEnrollments: (UserEnrollments: UserEnrollments) => void;
  setScore: (courseId: string, assessmentId: string, score: number) => void;
}

export const useEnrollmentStore = create<StoreState>((set) => ({
  enrollments: [],
  // shouldRefetchEnrollment: Boolean,
  setEnrollments: (data: UserEnrollments) => set({ enrollments: data }), 
  // setShouldRefetchEnrollment: ((data: boolean) => set({shouldRefetchEnrollment: data})),
//     set((state: any) => {
//       console.log(state);
//       const currentEnrollment = state.enrollments.filter(
//         (enrollment: any) => enrollmentId == enrollment.id,
//       )[0];
//       const currentAssessment = currentEnrollment.assessments.filter(
//         (assessment: any) => assessment.id === assessmentId,
//       )[0];
//       const updated = {
//         ...state.enrollments,
//       };
//       console.log("curr", currentEnrollment);
//       console.log("curr ass", currentAssessment);
//       console.log(enrollmentId, assessmentId, mark);

//       const updatedScores = {
//         ...state.scores,
//         [enrollmentId]: {
//           ...state.scores[enrollmentId],
//           [assessmentId]: mark,
//         },
//       };
//       console.info(updated);
//       return { scores: updatedScores };
//     }),
  setScore: (enrollmentId: string, assessmentId: string, mark: number) =>
    set((state: any) => {
      const currentEnrollmentIndex = state.enrollments.findIndex(
        (enrollment: any) => enrollment.id === enrollmentId,
      );

      if (currentEnrollmentIndex === -1) return state; 
      const currentEnrollment = state.enrollments[currentEnrollmentIndex];

      const currentAssessmentIndex = currentEnrollment.assessments.findIndex(
        (assessment: any) => assessment.id === assessmentId,
      );

      if (currentAssessmentIndex === -1) return state; 

      const updatedEnrollments = [...state.enrollments];

      const updatedAssessments = [...currentEnrollment.assessments];

      updatedAssessments[currentAssessmentIndex] = {
        ...updatedAssessments[currentAssessmentIndex],
        mark,
      };

      updatedEnrollments[currentEnrollmentIndex] = {
        ...currentEnrollment,
        assessments: updatedAssessments,
      };

      return { ...state, enrollments: updatedEnrollments };
    }),

  getScores: (enrollmentId: string) => (state: any) =>
    state.scores[enrollmentId] || {},
}));
