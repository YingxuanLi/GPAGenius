import axios from "axios";
import * as cheerio from 'cheerio';
import * as fs from "fs";
// import * as path from "path";

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

const getTableOld = async (
  sectionCode: string,
): Promise<Array<[string, string]>> => {
  const headers = {
    "User-Agent": "My User Agent 1.0",
  };

  const url = `https://archive.course-profiles.uq.edu.au/student_section_loader/section_5/${sectionCode}`;

  const page = await axios.get(url, { headers });
 const data = page.data

  const $ = cheerio.load(data);
  const table = $('table').first(); // Assuming the first table is the one we need
let assessments: any = []
table.find('tbody tr').each((_, row) => {
    const cells = $(row).find('td');

    // Extract the data from each cell
    const task = cells.eq(0).text().trim().replace(/\s+/g, ' ');
    const dueDate = cells.eq(1).text().trim().replace(/\s+/g, ' ');
    const weight = cells.eq(2).text().trim();
    const objectives = cells.eq(3).text().trim().replace(/\s+/g, ' ');

    assessments.push({ task, dueDate, weight, objectives });
  });
  return assessments
};

const getTable = async (
  semester: number,
  year: number,
  sectionCode: string,
): Promise<Array<[string, string]>> => {
  const headers = {
    "User-Agent": "My User Agent 1.0",
  };

  if ((year === 2024 && semester === 1) || year < 2024) {
    console.log('use old table')
    return getTableOld(sectionCode);
  }

  const url = `https://course-profiles.uq.edu.au/course-profiles/${sectionCode}#assessment`;
  const page = await axios.get(url, { headers });
  const $ = cheerio.load(page.data);

  $("ul.icon-list").remove();

  const table = $("table");
  const rows = table.find("tbody tr");
  const data: Array<[string, string]> = [];

//   console.info('ROWS', rows)
//   fs.writeFileSync('file.txt', $(row))

  rows.each((_, row) => {
    console.log(row)
    const cols = $(row).find("td");
    const task = cols.eq(0).text().trim();
    let weight = cols.eq(1).text().trim();
    console.log('weight', weight)
    console.log('task', task)

    if (!weight.includes("%") && !isNaN(Number(weight))) {
      const percentage = (100 / rows.length).toFixed(2);
      weight = `${percentage}%`;
    }

    data.push([task, weight.replace("%", "") + "%"]);
  });


  return data;
};

const getTable2 = async() => {
    const headers = {
        "User-Agent": "My User Agent 1.0",
      };
  const url = `https://archive.course-profiles.uq.edu.au/student_section_loader/section_5/131990`;
  const page = await axios.get(url, { headers });
  const $ = cheerio.load(page.data);
    const table = $('table').first(); // Assuming the first table is the one we need

    // Iterate over each row in the table's tbody
    table.find('tbody tr').each((_, row) => {
      const cells = $(row).find('td');

      // Extract the data from each cell
      const task = cells.eq(0).text().trim().replace(/\s+/g, ' ');
      const dueDate = cells.eq(1).text().trim().replace(/\s+/g, ' ');
      const weight = cells.eq(2).text().trim();
      const objectives = cells.eq(3).text().trim().replace(/\s+/g, ' ');

      console.info({task, dueDate, weight, objectives})
      // Add the extracted data to the assessments array
    //   assessments.push({ task, dueDate, weight, objectives });
    });
    
}

// getTable2()

const getAssessments = async (
  code: string,
  semester: string,
  year: string,
): Promise<Array<[string, string]>> => {
  const courseProfile = await getPage(code, semester, year);
  if (!courseProfile) {
    throw new WrongSemesterError(code, semester);
  }

  const sectionCode = courseProfile.split("/").pop()!;
  console.log('section Code',sectionCode)
  const assessments = await getTable(
    Number(semester),
    Number(year),
    sectionCode,
  );

//   console.info(assessments)

//   const logData = `${Date.now()}|${code}|${semester}|${year}\n`;
//   fs.appendFileSync(path.join(THIS_FOLDER, "logs", "new_log.txt"), logData);

//   const discordData = {
//     content: "",
//     username: "UQmarks",
//     embeds: [
//       {
//         description: `${semester} ${year}`,
//         title: `${code} - NEW CODE`,
//       },
//     ],
//   };

  // Example Discord logging, uncomment if necessary
  // await axios.post(process.env.LOG_LINK!, discordData, { headers });

  return assessments;
};

const res = await getAssessments('CSSE2002', '2', '2023')
console.log(res)
// @ts-ignore
// fs.writeFileSync('testfile.txt', res.toString())
// console.info(res)

export { CourseNotFoundError, WrongSemesterError, getAssessments };
