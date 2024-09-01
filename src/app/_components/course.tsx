"use client";

import { AssessmentDetail } from "~/server/utils/courseScraper";
import { api } from "~/trpc/react";

export function Course() {
  const [course] = api.course.getCourseById.useSuspenseQuery({
    courseId: "63693c8f-ba05-4521-b9b1-8535bf1594c1",
  });

  const assessments: AssessmentDetail[] =
    course?.assessments as AssessmentDetail[];

  return (
    <>
      <h1 className="w-full max-w-xs">Course Info</h1>
      <div>{course?.courseCode}</div>
      <div>{course?.courseName}</div>
      <div>
        {assessments[0]?.title} : {assessments[0]?.weight}
      </div>
      <div>
        {assessments[1]?.title}: {assessments[1]?.weight}
      </div>
    </>
  );
}
