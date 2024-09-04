"use client";

import { useState, useEffect } from "react";
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
  const [courseCode, setCourseCode] = useState("");

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString()); // default is current year
  const currentMonth = new Date().getMonth() + 1;
  const defaultSemester = currentMonth >= 7 && currentMonth <= 12 ? "2" : "1";
  const [semester, setSemester] = useState(defaultSemester);
  const formattedCourseCode = courseCode.toUpperCase(); // upper case course code

  const { data: course } = api.course.getCourseByCodeAndSemester.useQuery(
    {
      courseCode: formattedCourseCode,
      year: parseInt(year),
      semester: semester,
    },
    {
      enabled: !!courseCode && !!year && !!semester,
    }
  );

  const assessments: AssessmentDetail[] =
    course?.assessments as AssessmentDetail[] || [];

  // Options for target score selection
  const targetScoreOptions = [
    { value: "1", label: "Below 20%" },
    { value: "2", label: "20-45%" },
    { value: "3", label: "45-50%" },
    { value: "4", label: "50-65%" },
    { value: "5", label: "65-75%" },
    { value: "6", label: "75-85%" },
    { value: "7", label: "Above 85%" },
  ];


  const [targetScore, setTargetScore] = useState("4"); // Default to "50-65%"

  const [scores, setScores] = useState(Array(assessments.length).fill(0)); // Initialize score array

  const [currentGradeLevel, setCurrentGradeLevel] = useState("0");
  const [totalScore, setTotalScore] = useState(0);

  const handleScoreChange = (e, index) => {
    const newScores = [...scores];
    newScores[index] = parseFloat(e.target.value) || 0; // Handle empty input
    setScores(newScores);
  };

  useEffect(() => {
    const newTotalScore = assessments.reduce((total, assessment, index) => {
      return total + (scores[index] * parseFloat(assessment.weight) / 100);
    }, 0);

    setTotalScore(newTotalScore);

    const gradeLevel = targetScoreOptions.find(option => {
      const min = parseInt(option.value) * 10 + 10;
      const max = min + 25;
      return newTotalScore >= min && newTotalScore < max;
    })?.value || "0";

    setCurrentGradeLevel(gradeLevel);
  }, [scores, assessments, targetScoreOptions]);

  const remainingWeight = assessments.reduce((total, assessment, index) => {
    if (index === assessments.length - 1) {
      return total + parseFloat(assessment.weight);
    }
    return total;
  }, 0);

  const targetPercentage = parseInt(targetScore) * 10 + 20; // Assuming each option increases by 10%

  const requiredScoreForLastAssignment = remainingWeight > 0
    ? ((targetPercentage - totalScore) / remainingWeight) * 100
    : 0;

  const passScore = 50; // Default passing score is 50%

  const passMessage = totalScore >= passScore
    ? "You have passed the course!"
    : `You need ${(passScore - totalScore).toFixed(2)}% more to pass the course.`;

  const targetMessage = remainingWeight > 0
    ? `To reach your target score, you need ${(requiredScoreForLastAssignment).toFixed(2)}% on the final assignment.`
    : `You have achieved your target score of ${targetPercentage}%.`;

  // Years option
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - i);

  return (
    <>
      <h1 className="w-full max-w-xs">Course Info</h1>

      <div className="flex flex-col space-y-4">
        <input
          type="text"
          placeholder="Please input course code"
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
          className="input"
        />
        
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="input"
        >
          {yearOptions.map((yearOption) => (
            <option key={yearOption} value={yearOption}>
              {yearOption}
            </option>
          ))}
        </select>
        
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="input"
        >
          <option value="1">1</option>
          <option value="2">2</option>
        </select>
        
        <select
          value={targetScore}
          onChange={(e) => setTargetScore(e.target.value)}
          className="input"
        >
          {targetScoreOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <Button
          onClick={() => {
            // This button triggers the query to fetch course details
          }}
        >
          Fetch Course Details
        </Button>
      </div>

      {course && (
        <Card className="w-[500px] mt-4">
          <CardHeader>
            <CardTitle>
              {course.courseCode} {course.courseName}
            </CardTitle>
            <CardDescription>{course.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Assignment List:</p>
            <ul>
              {assessments.map((assessment, index) => (
                <li key={index}>
                  {assessment.title}: {assessment.weight}
                  <input
                    type="number"
                    placeholder="Input your score"
                    min="0"
                    max="100"
                    onChange={(e) => handleScoreChange(e, index)}
                    className="input"
                  />
                </li>
              ))}
            </ul>
            <p>Current Grade Level: {currentGradeLevel}</p>
          </CardContent>
          <CardFooter>
            <p>Credits: {course.credit}</p>
            <p>{passMessage}</p>
            <p>{targetMessage}</p>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
