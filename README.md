# GPA Genius Demo

Try it: [GPA Genius](https://gpa-genius.vercel.app/)

## Contributors
- **Libby Liu** (@Manyanggg): Software Engineer @NetEngine, UQ Alumna
- **Benson Li** (@YingxuanLi): Software Engineer @Codafication, UQer, Badminton Player, Part-Time Procrastinator

## Overview
**GPA Genius** helps university students calculate their GPA and provides insights into their academic performance. The platform includes features such as course profile parsing, GPA calculation, percentile rankings for assessment items, and secure user authentication.

## Database Design
![GPA Genius Database Design](/.eraser/5Ivho9JUgVZgpx1BsioF___6yy2RtPnVvYhBxKDqZ9DwUbJIj23___wq8cGn4BYkcc2BEWfIYxv.png "GPA Genius Database Design")

## Features

### 1. **Course Parser**
The course parser leverages **Cheerio** to extract data from UQ course profiles, including:
- Course Name
- Course Code
- Assessment Items

**Example Output:**

<details>
  <summary>Assessment for ENGG1300</summary>

```json
[
  {
    "mode": "Written",
    "title": "Weekly On-line Quizzes (1.875% each)",
    "weight": "15% (Best 8 of the 11 quizzes count)",
    "dueDate": "29/07/2024 - 21/10/2024\n\nWeekly quizzes are due every Monday at 1pm (except Week 1 & Week 11).",
    "category": "Quiz",
    "isHurdled": false,
    "taskDescription": "Each week (with the exception of week 1 and week 11), students will undertake a short on-line quiz via Blackboard to test their knowledge.",
    "learningOutcomes": "L01, L02, L03, L04, L05, L06, L07",
    "additionalDetails": {
      "Other conditions": "Time limited. See the conditions definitions"
    },
    "hurdleRequirements": ""
  },
  {
    "mode": "Written",
    "title": "On-Campus In-semester test",
    "weight": "20%",
    "dueDate": "In-semester Saturday\n31/08/2024 - 14/09/2024\n\nCentrally scheduled mid-semester exams will be scheduled for a Saturday at the end of week 6, 7 or 8. The timetable is scheduled to be released on Thursday 1st of August.",
    "category": "Examination",
    "isHurdled": false,
    "taskDescription": "This closed book multiple-choice exam involves solving numerical, circuit based problems, based on material in the first part of the course.",
    "learningOutcomes": "L01, L02, L03, L04, L07",
    "additionalDetails": {
      "Other conditions": "Time limited. See the conditions definitions"
    },
    "hurdleRequirements": ""
  },
  {
    "mode": "Activity/ Performance, Oral, Written",
    "title": "Audio filter Practical Exam Demonstration",
    "weight": "10%",
    "dueDate": "8/10/2024 - 11/10/2024\n\nStudents will be allocated to 1-hour of one of their scheduled Wk 11 practical classes.",
    "category": "Examination, Practical/ Demonstration",
    "isHurdled": false,
    "taskDescription": "Your task is to design, implement and test a passive filter (using resistors and/or capacitors and/or inductors) to remove noise from a provided audio recording while preserving the quality of the original signal.",
    "learningOutcomes": "L01, L02, L03, L04, L07",
    "hurdleRequirements": ""
  },
  {
    "mode": "Written",
    "title": "Final Exam",
    "weight": "55%",
    "dueDate": "End of Semester Exam Period\n2/11/2024 - 16/11/2024",
    "category": "Examination",
    "isHurdled": true,
    "taskDescription": "An on-campus closed-book examination of 2 hours duration + 10 minutes planning time will be conducted covering all aspects of the course.",
    "learningOutcomes": "L01, L02, L03, L04, L05, L06, L07",
    "hurdleRequirements": ""
  }
]
```

</details>

### 2. **Percentile Ranking**
Students can view their percentile ranking for each assessment item. The ranking is calculated using an SQL query to determine their performance relative to others in the course:

```sql
SELECT rank
FROM (SELECT *, 
             percent_rank() OVER (ORDER BY mark) AS rank
      FROM (SELECT enrollment_id,
                   user_assessment.id AS aid,
                   assignment_name,
                   course_id,
                   mark
            FROM user_assessment
            JOIN enrollment ON user_assessment.enrollment_id = enrollment.id
            JOIN course ON enrollment.course_id = course.id
            WHERE course_id = '${assessmentWithCourse?.enrollment.courseId}'
              AND assignment_name = '${assessmentWithCourse?.assignmentName}') AS uaec) AS assessments_ranks
WHERE assessments_ranks.aid = '${assessmentWithCourse?.id}';
```

### 3. **User Authentication**
GPA Genius handles user authentication via **NextAuth.js**, using Google SSO for secure and seamless login.

### 4. **Autocomplete**
Users can search and select courses through an autocomplete box, powered by PostgreSQL’s Full-Text Search (FTS) feature. While caching the course data on the frontend might have been more efficient, implementing FTS allowed us to explore the powerful search capabilities PostgreSQL offers—a valuable learning experience.

## Tech Overview
![Tech Overview](/.eraser/5Ivho9JUgVZgpx1BsioF___6yy2RtPnVvYhBxKDqZ9DwUbJIj23___fT92kbggO_BBwmXEjNmQg.png "Tech Overview")

## Installation and Setup

1. **Install Bun**:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Start Development**:
   ```bash
   bun install
   bun dev
   ```

   This will start the development server on `localhost:3001`.
