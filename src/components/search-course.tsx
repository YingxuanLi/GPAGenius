"use client";

import { useState, useMemo } from "react";
import { Input } from "~/components/ui/input";

type Course = {
  id: number;
  image: string;
  title: string;
  description: string;
};

export function SearchCourse() {
  // Initialize the courses array with type Course[]
  const courses: Course[] = [
    {
      id: 1,
      image: "/placeholder.svg?height=80&width=80",
      title: "Introduction to Web Development",
      description:
        "Learn the fundamentals of building websites and web applications.",
    },
    {
      id: 2,
      image: "/placeholder.svg?height=80&width=80",
      title: "Data Structures and Algorithms",
      description:
        "Dive into the core concepts of computer science and problem-solving.",
    },
    {
      id: 3,
      image: "/placeholder.svg?height=80&width=80",
      title: "Machine Learning for Beginners",
      description:
        "Explore the world of artificial intelligence and build your first ML models.",
    },
    {
      id: 4,
      image: "/placeholder.svg?height=80&width=80",
      title: "Introduction to Mobile App Development",
      description:
        "Learn to build cross-platform mobile apps using modern frameworks.",
    },
    {
      id: 5,
      image: "/placeholder.svg?height=80&width=80",
      title: "Mastering React.js",
      description:
        "Become a pro at building dynamic user interfaces with React.",
    },
    {
      id: 6,
      image: "/placeholder.svg?height=80&width=80",
      title: "Database Design and Management",
      description: "Understand the principles of database systems and SQL.",
    },
    {
      id: 7,
      image: "/placeholder.svg?height=80&width=80",
      title: "Cybersecurity Fundamentals",
      description:
        "Explore the world of information security and protect your digital assets.",
    },
    {
      id: 8,
      image: "/placeholder.svg?height=80&width=80",
      title: "Game Development with Unity",
      description:
        "Learn to create 2D and 3D games using the powerful Unity engine.",
    },
    {
      id: 9,
      image: "/placeholder.svg?height=80&width=80",
      title: "Introduction to Python Programming",
      description:
        "Master the versatile Python language and build your first applications.",
    },
    {
      id: 10,
      image: "/placeholder.svg?height=80&width=80",
      title: "Full-Stack Web Development with Node.js",
      description:
        "Learn to build end-to-end web applications using the Node.js ecosystem.",
    },
  ];

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, courses]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsDropdownOpen(e.target.value.length > 0);
  };

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setIsDropdownOpen(false);
  };

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
          {filteredCourses.length > 0 ? (
            <ul className="py-1">
              {filteredCourses.map((course) => (
                <li
                  key={course.id}
                  className={`flex items-center gap-3 px-4 py-2 hover:bg-muted ${
                    selectedCourse?.id === course.id ? "bg-muted" : ""
                  }`}
                  onClick={() => handleCourseSelect(course)}
                >
                  <img
                    src={course.image}
                    alt={course.title}
                    width={40}
                    height={40}
                    className="rounded-md"
                    style={{ aspectRatio: "40/40", objectFit: "cover" }}
                  />
                  <div>
                    <h4 className="font-medium">{course.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {course.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-2 text-muted-foreground">
              No courses found.
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
