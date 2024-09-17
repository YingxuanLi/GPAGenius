"use client";

import { useEffect, useState } from "react";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { useDebounce } from "use-debounce";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";

export function SearchCourse() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 800);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [shouldFetchEnrollments, setShouldFetchEnrollments] =
    useState<boolean>(false);

  const {
    data: filteredCourses,
    isLoading,
    error: searchCourseError,
    refetch: refetchCourses,
  } = api.course.autocomplete.useQuery(
    { searchTerm: debouncedSearchTerm },
    { enabled: !!debouncedSearchTerm },
  );
  const { data: enrollmentsData, refetch: refetchEnrollments } =
    api.user.getUserEnrollments.useQuery(
      { userId: "" },
      { enabled: shouldFetchEnrollments },
    );

  const createEnrollment = api.user.createUserEnrollment.useMutation({
    onSuccess: async (course) => {
      console.info(
        `successfully enrolled into course::${JSON.stringify(course)}`,
      );
      setSearchTerm("");
      refetchEnrollments();
    },
  });

  const createParsedCourse = api.course.insertParsedCourse.useMutation({
    onSuccess: async () => {
      refetchCourses();
    },
  });

  type ArrayElement<T> = T extends (infer U)[] ? U : null;
  type Course = ArrayElement<typeof filteredCourses>;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(e.target.value.length > 0);
  };

  const handleCourseSelect =  (course: Course) => {
    if (!course) return;
    setSelectedCourse(course?.id || "");
    setIsDropdownOpen(false);
  createEnrollment.mutate({
      courseId: course.id,
    });
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Input
          type="text"
          placeholder="Enroll in a course"
          value={searchTerm}
          onChange={handleInputChange}
          className="pr-10"
        />
        <SearchIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
      </div>
      {isDropdownOpen && (
        <div className="absolute z-10 mt-2 max-h-[300px] w-full overflow-y-auto rounded-md bg-background shadow-lg ring-1 ring-black/5">
          {!!filteredCourses && filteredCourses?.length > 0 ? (
            <ul className="py-1">
              {filteredCourses.map((course) => (
                <li
                  key={course.id}
                  className={`flex items-center gap-3 px-4 py-2 hover:bg-muted ${
                    selectedCourse === course.id ? "bg-muted" : ""
                  }`}
                  onClick={() => handleCourseSelect(course)}
                >
                  <div>
                    <h4 className="font-medium">
                      {course.courseCode} - {course.courseName}
                    </h4>
                    {/* <p className="text-sm text-muted-foreground">
                      {course.description}
                    </p> */}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-2 text-muted-foreground">
              {isLoading && (
                <div className="px-4 py-2 text-muted-foreground">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              )}
              No courses found.
              <Button
                onClick={() => {
                  //TODO: Remove hardcoded value here at some point
                  createParsedCourse.mutate({
                    courseCode: debouncedSearchTerm,
                    year: 2024,
                    semester: "2",
                  });
                }}
              >
                {`Try to parse course from UQ`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
