/** Add fonts into your Next.js project:

import { Libre_Franklin } from 'next/font/google'

libre_franklin({
  subsets: ['latin'],
  display: 'swap',
})

To read more about using these font, please visit the Next.js documentation:
- App Directory: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- Pages Directory: https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
**/
"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { SearchCourse } from "./search-course";

export function Enrollments() {
  // replace these dummy data with actual user course enrollments and assessments
  const [courseData, setCourseData] = useState([
    {
      id: 1,
      code: "CS101",
      name: "Introduction to Computer Science",
      assessments: [
        { id: 1, name: "Homework 1", weight: 0.1, grade: 0 },
        { id: 2, name: "Midterm Exam", weight: 0.3, grade: 0 },
        { id: 3, name: "Final Exam", weight: 0.4, grade: 0 },
        { id: 4, name: "Participation", weight: 0.2, grade: 0 },
      ],
    },
    {
      id: 2,
      code: "MATH201",
      name: "Calculus I",
      assessments: [
        { id: 1, name: "Quiz 1", weight: 0.1, grade: 0 },
        { id: 2, name: "Quiz 2", weight: 0.1, grade: 0 },
        { id: 3, name: "Midterm Exam", weight: 0.3, grade: 0 },
        { id: 4, name: "Final Exam", weight: 0.5, grade: 0 },
      ],
    },
    {
      id: 3,
      code: "PHYS101",
      name: "Introductory Physics",
      assessments: [
        { id: 1, name: "Lab Report 1", weight: 0.15, grade: 0 },
        { id: 2, name: "Lab Report 2", weight: 0.15, grade: 0 },
        { id: 3, name: "Midterm Exam", weight: 0.3, grade: 0 },
        { id: 4, name: "Final Exam", weight: 0.4, grade: 0 },
      ],
    },
  ]);
  // TODO: Implement handle change function
  const handleGradeChange = (
    courseId: string,
    assessmentId: string,
    grade: string,
  ) => {
    // setCourseData((prevCourseData) =>
    //   prevCourseData.map((course) => {
    //     if (course.id === courseId) {
    //       return {
    //         ...course,
    //         assessments: course.assessments.map((assessment) => {
    //           if (assessment.id === assessmentId) {
    //             return { ...assessment, grade };
    //           }
    //           return assessment;
    //         }),
    //       };
    //     }
    //     return course;
    //   }),
    // );
  };

  // TODO: handle custom user grade input types such as 80, 80%, 21/50
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">My Course Enrollments</h1>
      <SearchCourse />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courseData.map((course) => (
          <Card key={course.id} className="h-full">
            <CardHeader>
              <CardTitle className="truncate whitespace-normal text-xl sm:text-2xl md:text-3xl lg:text-2xl xl:text-3xl">
                {course.code} - {course.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {course.assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{assessment.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Weight: {assessment.weight * 100}%
                      </div>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={assessment.grade}
                      onChange={(e) => {
                        console.log(e);
                      }}
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
                  {course.assessments
                    .reduce(
                      (total, assessment) =>
                        total + assessment.grade * assessment.weight,
                      0,
                    )
                    .toFixed(2)}
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
