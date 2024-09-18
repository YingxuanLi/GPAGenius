<p><a target="_blank" href="https://app.eraser.io/workspace/5Ivho9JUgVZgpx1BsioF" id="edit-in-eraser-github-link"><img alt="Edit in Eraser" src="https://firebasestorage.googleapis.com/v0/b/second-petal-295822.appspot.com/o/images%2Fgithub%2FOpen%20in%20Eraser.svg?alt=media&amp;token=968381c8-a7e7-472a-8ed6-4a6626da5501"></a></p>

# GPA Genius Demo
Try it: [﻿GPA Genius](https://gpa-genius.vercel.app/) 

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

### 4. **AutoComplete**
Users can search and select courses through an autocomplete box, powered by PostgreSQL’s Full-Text Search (FTS) feature. While caching the course data on the frontend might have been a more efficient approach, implementing FTS allowed us to explore the impressive capabilities PostgreSQL offers for advanced search functionality—a valuable learning experience.

## Technologies
![image.png](/.eraser/5Ivho9JUgVZgpx1BsioF___6yy2RtPnVvYhBxKDqZ9DwUbJIj23___sGmixv3Hg7dpOAgdlEkli.png "image.png")

## Installation and Setup
1. **Install Bun**:curl -fsSL [﻿https://bun.sh/install](https://bun.sh/install)  | bash
2. **Start Development**:This will start the development server on `localhost:3001`  .bun install
bun dev



<!-- eraser-additional-content -->
## Diagrams
<!-- eraser-additional-files -->
<a href="/README-cloud-architecture-1.eraserdiagram" data-element-id="3TG_Jf71JXOG1TOyms3H5"><img src="/.eraser/5Ivho9JUgVZgpx1BsioF___6yy2RtPnVvYhBxKDqZ9DwUbJIj23___---diagram----be7c09dc5e87b56fac7e71a4e2c3c048.png" alt="" data-element-id="3TG_Jf71JXOG1TOyms3H5" /></a>
<!-- end-eraser-additional-files -->
<!-- end-eraser-additional-content -->
<!--- Eraser file: https://app.eraser.io/workspace/5Ivho9JUgVZgpx1BsioF --->