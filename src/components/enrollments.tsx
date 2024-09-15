"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { SearchCourse } from "./search-course";
import { useEnrollmentStore } from "~/app/stores/enrollment-store";


export function Enrollments() {
  // const userId = "9f632171-cc4b-4210-9b72-d5466923023b";
  const [fetchTrigger, setFetchTrigger] = useState(false);
  const { enrollments, setEnrollments, setScore, shouldRefetchEnrollment } =
    useEnrollmentStore() as any;
  const { data: enrollmentsData, isLoading } =
    api.user.getUserEnrollments.useQuery({ userId: "" });

  const updateAssessment = api.user.updateUserAssessment.useMutation({
    onSuccess: async (course) => {
      console.info(
        `assessment updated::${JSON.stringify(course)}`,
      );
    },
  });
  type ArrayElement<T> = T extends (infer U)[] ? U : null;


  useEffect(() => {
    if (enrollmentsData) {
      setEnrollments(enrollmentsData);
    }
  }, [enrollmentsData]);

  // Handle score input change
  //TODO: when user inputs a score, call updateAssessment mutation
  const handleScoreChange = (
    enrollmentId: string,
    assessmentId: string,
    mark: number,
  ) => {
    // const updatedScores = [...scores];
    // updatedScores[courseIndex][assessmentIndex] = score;
    setScore(enrollmentId, assessmentId, mark);
    updateAssessment.mutate({ id: assessmentId, mark });
    console.log(mark);
    // setScores(Number(score));
  };

  const calculateTotalScore = (assessments: any[]) => {
    return assessments.reduce((total, assessment, index) => {
      return total + (assessment.mark * parseFloat(assessment.weight));
    }, 0);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">My Course Enrollments</h1>
      <SearchCourse />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {enrollments?.map((enrollment: ArrayElement<typeof enrollmentsData>) => (
          <Card key={enrollment?.id} className="h-full">
            <CardHeader>
              <CardTitle className="truncate whitespace-normal text-xl sm:text-2xl md:text-3xl lg:text-2xl xl:text-3xl">
                {enrollment?.course.courseCode} - {enrollment?.course.courseName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrollment?.assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">
                        {assessment.assignmentName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Weight: {assessment.weight * 100}%
                      </div>
                    </div>
                    <Input
                      type="string"
                      min="0"
                      max="100"
                      value={assessment.mark || 0}
                      onChange={(e) =>
                        handleScoreChange(
                          enrollment.id,
                          assessment.id,
                          Number(e.target.value),
                        )
                      }
                      className="w-20"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center justify-between">
                <div className="font-medium">Overall Grade:</div>
                <div className="text-2xl font-bold">
                  {calculateTotalScore(enrollment!.assessments).toFixed(2)}
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
