import { create } from "zustand";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

type RouterOutput = inferRouterOutputs<AppRouter>;
type UserEnrollment = RouterOutput["user"]["getUserEnrollments"][0];

interface StoreState {
  enrollments: UserEnrollment[];
  setEnrollments: (UserEnrollments: UserEnrollment[]) => void;
  setScore: (courseId: string, assessmentId: string, score: number) => void;
  addEnrollment: (newEnrollment: UserEnrollment) => void;
}

export const useEnrollmentStore = create<StoreState>((set) => ({
  enrollments: [],
  // shouldRefetchEnrollment: Boolean,
  setEnrollments: (data: UserEnrollment[]) => set({ enrollments: data }),
  addEnrollment: (newEnrollment: UserEnrollment) =>
    set((state) => ({
      enrollments: [...state.enrollments, newEnrollment],
    })),
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
}));
