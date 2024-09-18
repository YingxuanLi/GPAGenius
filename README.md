<p><a target="_blank" href="https://app.eraser.io/workspace/5Ivho9JUgVZgpx1BsioF" id="edit-in-eraser-github-link"><img alt="Edit in Eraser" src="https://firebasestorage.googleapis.com/v0/b/second-petal-295822.appspot.com/o/images%2Fgithub%2FOpen%20in%20Eraser.svg?alt=media&amp;token=968381c8-a7e7-472a-8ed6-4a6626da5501"></a></p>

# GPA Genius Demo Doc
## Contributors
Libby Liu: @Manyanggg Software Engineer @NetEngine, UQer 

Benson Li: @YingxuanLi Software Engineer @Codafication, UQer, badminton player, part-time procrastinator.

## Overview
This project aims to assist university students in calculating their GPA grades. It includes features for parsing course profiles, calculating percentile rankings for assessment items, and handling user authentication.

## Features
### Course Parser
The course parser uses Cheerio to extract course profiles from UQ, including:

- Course Name
- Course Code
- Assessment Items
These details are utilised to create user assessment items for their course enrollments.
### Ranking
Users can view the percentile ranking for each of their assessment items. This is achieved through an SQL query:

```
sql.raw(`
    select rank
      from (select *, percent_rank() over (order by mark) as rank
from (select enrollment_id,
             user_assessment.id as aid,
             assignment_name,
             course_id,
             mark
      from user_assessment
               join enrollment on user_assessment.enrollment_id = enrollment.id
               join course on enrollment.course_id = course.id
      where course_id = '${assessmentWithCourse?.enrollment.courseId}'
        and assignment_name = '${assessmentWithCourse?.assignmentName}') as uaec) assessments_ranks
  where assessments_ranks.aid = '${assessmentWithCourse?.id}';
  `)
```
## DB Design
![db-diagram-gpa-genius.png](/.eraser/5Ivho9JUgVZgpx1BsioF___6yy2RtPnVvYhBxKDqZ9DwUbJIj23___7TlxVJt3jbgmjK8J8kfUt.png "db-diagram-gpa-genius.png")

## Technologies Used (The t3 stack)
### Frontend
- TypeScript
- Next.js
- Shadcn 
- tailwind
### Backend
- TRPC - for e2e typesafety
- Supabase (Postgres) 
- Drizzle-ORM
### Auth
- Next-auth with Google SSO
### HTML Parsing
- Cheerio
### Deployment:
- Vercel
## Installation and Setup
Install Bun: `curl -fsSL https://bun.sh/install | bash` 

To start development:

`bun install` THEN `bun dev` 

This will start a development server on localhost:3001



<!--- Eraser file: https://app.eraser.io/workspace/5Ivho9JUgVZgpx1BsioF --->