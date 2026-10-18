# School database design

This database tracks which students are enrolled on which courses, and what grade they earned. It has three tables.

## Tables

**students** holds one row per person who studies at the school: `student_id` (primary key), `first_name`, `last_name` and `email`. The email is `NOT NULL` and `UNIQUE`, so no two students can share one address and every student can be contacted.

**courses** holds one row per course that is offered: `course_id` (primary key), `title` and `credits`. A `CHECK` rule makes sure credits are always a positive number.

**enrolments** holds one row per student-on-course pairing: `enrolment_id` (primary key), `student_id` and `course_id` (both foreign keys, both `NOT NULL`), `enrolled_on` and `grade`. The grade is allowed to be `NULL` because a student has no grade until the course is marked. A `UNIQUE (student_id, course_id)` rule stops the same student enrolling on the same course twice.

## Relationships

- **One student to many enrolments** (one-to-many). One student can have many enrolment rows, but each enrolment row belongs to exactly one student.
- **One course to many enrolments** (one-to-many). One course can have many enrolment rows, but each enrolment row belongs to exactly one course.
- **Students to courses** (many-to-many). Taken together, one student can take many courses and one course can have many students.

A many-to-many relationship needs a join table because a single column cannot hold several values cleanly. If `students` had a `course_id` column, a student on three courses would need three values in one cell, or the student's row would have to be repeated three times with the name and email duplicated. Putting the link in its own table, `enrolments`, means each fact is stored once: one row per student-course pair. It is also the natural home for data that belongs to the *pairing* rather than to either side, like the grade and the enrolment date. A grade is not a property of a student or of a course, only of that student on that course.

## Index I would add

```sql
CREATE INDEX idx_enrolments_course_id ON enrolments (course_id);
```

The `UNIQUE (student_id, course_id)` rule already creates an index that SQLite can use for lookups starting with `student_id` ("all courses for this student"). Nothing equivalent exists for lookups starting with `course_id`, such as "all students on this course" or "how many students per course". Without an index on `course_id`, those queries would scan the whole enrolments table, which gets slow once there are thousands of enrolments. The index lets the database jump straight to the matching rows. The cost is a little extra storage and slightly slower inserts, which is a good trade for a table that is read far more often than it is written.

## SQL or NoSQL?

I would choose SQL (a relational database) for this system. The data is naturally structured and relational: students, courses and enrolments have fixed fields and clear links between them. A school also needs the database itself to enforce rules, such as no duplicate enrolment, no enrolment for a student or course that does not exist, and no two students sharing an email, and SQL gives those through constraints and foreign keys. Questions like "how many students per course" or "which students have no enrolments" are joins and aggregates, which SQL handles well. A NoSQL document database could work if the data were loosely structured or needed to scale across many servers, but a school's data is small, consistent and relationship-heavy, so the flexibility of NoSQL would add little and I would have to enforce the data rules in application code instead.