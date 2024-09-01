import axios from "axios";
import * as cheerio from "cheerio";

export interface LegacyAssessmentDetails {
  task: string;
  dueDate?: string;
  weight: string;
  objectives?: string;
}

export interface AssessmentDetail {
  title: string;
  mode?: string;
  category?: string;
  weight: string;
  dueDate?: string;
  taskDescription?: string;
  learningOutcomes?: string;
  hurdleRequirements?: string;
  additionalDetails?: Record<string, string>;
  isHurdled?: boolean;
}

class CourseNotFoundError extends Error {
  constructor(course: string) {
    super(`The course '${course}' could not be found or does not exist.`);
    this.name = "CourseNotFoundError";
  }
}

class WrongSemesterError extends Error {
  constructor(course: string, sem: string) {
    const message =
      sem === "3"
        ? `The course '${course}' does not exist in the summer semester.`
        : `The course '${course}' does not exist in the selected semester. (Semester ${sem})`;
    super(message);
    this.name = "WrongSemesterError";
  }
}

// const THIS_FOLDER = path.resolve(__dirname);

const returnUrl = (code: string): string =>
  `https://my.uq.edu.au/programs-courses/course.html?course_code=${code}`;

const getPage = async (
  code: string,
  semester: string,
  year: string,
): Promise<string | undefined> => {
  semester =
    semester === "1" || semester === "2"
      ? `Semester ${semester}`
      : "Summer Semester";
  const link = returnUrl(code);

  const headers = {
    "User-Agent": "My User Agent 1.0",
  };

  const page = await axios.get(link, { headers });

  const $ = cheerio.load(page.data);

  if ($("#course-notfound").length) {
    throw new CourseNotFoundError(code);
  }

  const rows = $("tr");

  for (let i = 0; i < rows.length; i++) {
    const text = $(rows[i]).text().trim();
    if (
      text.includes(year) &&
      text.includes(semester) &&
      !text.includes("unavailable")
    ) {
      const href = $(rows[i]).find("a.profile-available").attr("href");
      return href;
    }
  }
};

const getLegacyCourseProfileAssessments = async (
  sectionCode: string,
): Promise<LegacyAssessmentDetails[]> => {
  const headers = {
    "User-Agent": "My User Agent 1.0",
  };

  const url = `https://archive.course-profiles.uq.edu.au/student_section_loader/section_5/${sectionCode}`;

  const page = await axios.get(url, { headers });
  const data = page.data;

  const $ = cheerio.load(data);
  const table = $("table").first();
  let assessments: any = [];
  table.find("tbody tr").each((_, row) => {
    const cells = $(row).find("td");

    // Extract the data from each cell
    const task = cells.eq(0).text().trim().replace(/\s+/g, " ");
    const dueDate = cells.eq(1).text().trim().replace(/\s+/g, " ");
    const weight = cells.eq(2).text().trim();
    const objectives = cells.eq(3).text().trim().replace(/\s+/g, " ");

    assessments.push({ task, dueDate, weight, objectives });
  });
  return assessments;
};

const getTable = async (
  semester: number,
  year: number,
  sectionCode: string,
): Promise<LegacyAssessmentDetails[] | AssessmentDetail[]> => {
  const headers = {
    "User-Agent": "My User Agent 1.0",
  };

  if ((year === 2024 && semester === 1) || year < 2024) {
    return getLegacyCourseProfileAssessments(sectionCode);
  }

  const url = `https://course-profiles.uq.edu.au/course-profiles/${sectionCode}#assessment`;
  try {
    const { data } = await axios.get(url, { headers });
    const $ = cheerio.load(data);

    const assessments: AssessmentDetail[] = [];

    // Select the section containing assessment details
    const assessmentSection = $("#assessment-details");

    // Loop through each assessment detail
    assessmentSection.find("h3").each((_, element) => {
      const title = $(element).text().trim();
      const assessment: AssessmentDetail = {
        title,
        mode: "",
        category: "",
        weight: "",
        dueDate: "",
        taskDescription: "",
        hurdleRequirements: "",
      };

      // Find the corresponding dl (definition list) for this assessment
      const dl = $(element).nextAll("dl").first();

      dl.find("dt").each((i, dt) => {
        const key = $(dt).text().trim();
        const value = $(dt).next("dd").text().trim();

        switch (key) {
          case "Mode":
            assessment.mode = value;
            break;
          case "Category":
            assessment.category = value;
            break;
          case "Weight":
            assessment.weight = value;
            break;
          case "Due date":
            assessment.dueDate = value;
            break;
          case "Learning outcomes":
            assessment.learningOutcomes = value;
            break;
          default:
            assessment.additionalDetails = {
              ...assessment.additionalDetails,
              [key]: value,
            };
            break;
        }
      });

      // Find the task description
      const taskDescriptionElement = $(element)
        .nextAll("div.collapsible")
        .first();
      assessment.taskDescription = taskDescriptionElement
        .find("p")
        .first()
        .text()
        .trim();

      // Check for hurdle requirements
      const iconList = $(element).next("ul.icon-list").first();
      const isHurdle = iconList.text().includes("Hurdle");
      assessment.isHurdled = isHurdle;

      // Store the extracted assessment detail
      assessments.push(assessment);
    });

    return assessments;
  } catch (error) {
    console.error("Error scraping assessment details:", error);
    throw error;
  }
};

const getCourseAndAssessments = async (
  code: string,
  semester: string,
  year: string,
) => {
  const courseProfile = await getPage(code, semester, year);
  if (!courseProfile) {
    throw new WrongSemesterError(code, semester);
  }

  const sectionCode = courseProfile.split("/").pop()!;
  console.log("section Code", sectionCode);
  const assessments = await getTable(
    Number(semester),
    Number(year),
    sectionCode,
  );

  const { courseName, courseCode, units } = await getCourseInfo(sectionCode);

  return { courseName, courseCode, units, assessments };
};

const getCourseInfo = async (sectionCode: String) => {
  console.log("executed at " + new Date());
  const url = `https://course-profiles.uq.edu.au/course-profiles/${sectionCode}#course-overview`;
  const headers = {
    "User-Agent": "My User Agent 1.0",
  };
  const page = await axios.get(url, { headers });
  const data = page.data;

  const $ = cheerio.load(data);
  const overviewSection = $("#course-overview");
  const courseHeading = $("h1").text();
  //TODO: fix ts
  //@ts-ignore
  const courseName = courseHeading.match(/^[^(]+/)[0].trim();
  //@ts-ignore
  const courseCode = courseHeading!.match(/\(([^)]+)\)/)[1];
  const units = overviewSection
    .find("dt")
    .filter((_, element) => $(element).text().trim() === "Units")
    .next("dd")
    .text()
    .trim();

  console.log("name", courseName);
  console.log("name", courseCode);
  console.log("unit", units);

  const info = {
    courseName,
    courseCode,
    units,
  };
  return info;
};

export { CourseNotFoundError, WrongSemesterError, getCourseAndAssessments };
