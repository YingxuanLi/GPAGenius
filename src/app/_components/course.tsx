"use client";

import { AssessmentDetail } from "~/server/utils/courseScraper";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export function Course() {
  //
  const [course] = api.course.getCourseById.useSuspenseQuery({
    courseId: "63693c8f-ba05-4521-b9b1-8535bf1594c1",
  });

  const assessments: AssessmentDetail[] =
    course?.assessments as AssessmentDetail[];

  return (
    <>
      <h1 className="w-full max-w-xs">Course Info</h1>
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>
            {course?.courseCode} {course?.courseName}
          </CardTitle>
          <CardDescription>{course?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </Card>

      <div>{course?.courseCode}</div>
      <div>{course?.courseName}</div>
      {!!course?.courseCode && <Button>{course?.courseCode}</Button>}
      <div>
        {assessments[0]?.title} : {assessments[0]?.weight}
      </div>
      <div>
        {assessments[1]?.title}: {assessments[1]?.weight}
      </div>
    </>
  );
}
