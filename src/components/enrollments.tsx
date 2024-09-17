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
import { Button } from "./ui/button";
import { CrossIcon } from "./icons/cross-icon";
import { InfoIcon } from "./icons/info-icon";
import { TriangleAlertIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "~/server/api/root";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Assessment =
  RouterOutput["user"]["getUserEnrollments"][0]["assessments"][0];

export function Enrollments() {
  // const userId = "9f632171-cc4b-4210-9b72-d5466923023b";
  const [fetchTrigger, setFetchTrigger] = useState(false);
  const [showRankDialog, setShowRankDialog] = useState<boolean>(false);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(
    null,
  );
  const { enrollments, setEnrollments, setScore } = useEnrollmentStore();
  const {
    data: enrollmentsData,
    isLoading,
    refetch: refetchEnrollments,
  } = api.user.getUserEnrollments.useQuery({ userId: "" });

  //TODO: FIX THIS
  const { data: percentRank, refetch: refetchRank } =
    api.user.getUserAssessmentRankingByCourse.useQuery(
      {
        assessmentId: currentAssessment?.id || "",
      },
      { enabled: false },
    );
  const updateAssessment = api.user.updateUserAssessment.useMutation({
    onSuccess: async (course) => {
      console.info(`assessment updated::${JSON.stringify(course)}`);
    },
  });

  const deleteEnrollment = api.user.deleteUserEnrollment.useMutation({
    onSuccess: async (enrollment) => {
      console.info(`successfully deleted::${JSON.stringify(enrollment)}`);
      refetchEnrollments();
    },
  });

  useEffect(() => {
    if (enrollmentsData) {
      setEnrollments(enrollmentsData);
    }
  }, [enrollmentsData]);

  useEffect(() => {
    if (currentAssessment) {
      refetchRank();
    }
  }, [currentAssessment]);

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

  const handleEnrollmentDelete = (enrollmentId: string) => {
    deleteEnrollment.mutate({ enrollmentId });
  };
  const handleShowRankDialog = async (assessment: Assessment) => {
    setCurrentAssessment(assessment);
    setShowRankDialog(true);
    console.info(assessment);
    if (assessment) {
      refetchRank();
    }
  };
  const handleCloseRankDialog = () => {
    setShowRankDialog(false);
    setCurrentAssessment(null);
  };
  const calculateTotalScore = (assessments: any[]) => {
    return assessments.reduce((total, assessment, index) => {
      return total + assessment.mark * parseFloat(assessment.weight);
    }, 0);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">My Course Enrollments</h1>
      <SearchCourse />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {enrollments?.map((enrollment) => (
          <Card key={enrollment?.id} className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-l sm:text-l md:text-l lg:text-l xl:text-l truncate whitespace-normal">
                  {enrollment?.course.courseCode} -{" "}
                  {enrollment?.course.courseName}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEnrollmentDelete(enrollment?.id || "")}
                >
                  <CrossIcon className="h-4 w-4 hover:text-red-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrollment?.assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">
                          {assessment.assignmentName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Weight: {assessment.weight * 100}%
                        </div>
                      </div>
                      {/* @ts-ignore */}
                      {(enrollment.course.assessments.find(
                        (a: any) => a.title === assessment.assignmentName,
                      ).isHurdled) && (
                        <TriangleAlertIcon className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* TODO: better handle user input and api calls */}
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={assessment.mark || 0}
                        onChange={(e) => {
                          handleScoreChange(
                            enrollment.id,
                            assessment.id,
                            Number(e.target.value),
                          );
                          setCurrentAssessment(assessment);
                        }}
                        className="w-20"
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShowRankDialog(assessment)}
                      >
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
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
      {showRankDialog && currentAssessment && (
        <Dialog open={showRankDialog} onOpenChange={handleCloseRankDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Assessment Rank</DialogTitle>
              <DialogDescription>
                The rank of {currentAssessment?.assignmentName} for{" "}
                {
                  enrollments?.find(
                    (e) => e?.id === currentAssessment.enrollmentId,
                  )?.course.courseCode
                }{" "}
                within the cohort who uses this app.
              </DialogDescription>
            </DialogHeader>
            <div className="px-4 py-6">
              <div className="mt-4 flex items-center justify-between">
                <div className="font-medium">You beat:</div>
                <div className="text-2xl font-bold">
                  {!!percentRank && Number(percentRank.rank * 100).toFixed(2)}%
                  of users
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCloseRankDialog}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
