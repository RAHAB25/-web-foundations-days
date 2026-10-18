-- day6/school.sql
-- School database: students, courses and enrolments (SQLite)

PRAGMA foreign_keys = ON;

-- Start clean so the script can be re-run in the playground
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-----------------TABLES---------------------------


CREATE TABLE students (
    student_id  INTEGER PRIMARY KEY,
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    course_id   INTEGER PRIMARY KEY,
    title       TEXT NOT NULL,
    credits     INTEGER NOT NULL CHECK (credits > 0)
);

-- Join table: one row = one student enrolled on one course
CREATE TABLE enrolments (
    enrolment_id  INTEGER PRIMARY KEY,
    student_id    INTEGER NOT NULL,
    course_id     INTEGER NOT NULL,
    enrolled_on   TEXT NOT NULL DEFAULT (date('now')),
    grade         TEXT,  -- NULL until a grade is awarded
    FOREIGN KEY (student_id) REFERENCES students (student_id),
    FOREIGN KEY (course_id)  REFERENCES courses (course_id),
    -- Rule: the same student cannot enrol on the same course twice
    UNIQUE (student_id, course_id)
);

 ---------------SAMPLE DATA--------------------------------

INSERT INTO students (student_id, first_name, last_name, email) VALUES
    (1, 'Amina',  'Wanjiru', 'amina.wanjiru@example.com'),
    (2, 'Brian',  'Otieno',  'brian.otieno@example.com'),
    (3, 'Chloe',  'Mwangi',  'chloe.mwangi@example.com'),
    (4, 'David',  'Kamau',   'david.kamau@example.com');   -- will have no enrolments

INSERT INTO courses (course_id, title, credits) VALUES
    (1, 'Introduction to Databases', 3),
    (2, 'Web Development Basics',    4),
    (3, 'Business Communication',    2);

INSERT INTO enrolments (student_id, course_id, enrolled_on, grade) VALUES
    (1, 1, '2026-09-01', 'B'),
    (1, 2, '2026-09-01', NULL),
    (2, 1, '2026-09-02', 'A'),
    (3, 1, '2026-09-02', NULL),
    (3, 3, '2026-09-03', 'C');


 
-- ---------------QUERIES------------------------------------------------

-- 1. All courses for one student, found by name (Amina Wanjiru)
SELECT c.title, c.credits, e.grade
FROM students AS s
JOIN enrolments AS e ON e.student_id = s.student_id
JOIN courses    AS c ON c.course_id  = e.course_id
WHERE s.first_name = 'Amina' AND s.last_name = 'Wanjiru'
ORDER BY c.title;

-- 2. All students on one course (Introduction to Databases)
SELECT s.first_name, s.last_name, s.email, e.grade
FROM courses AS c
JOIN enrolments AS e ON e.course_id  = c.course_id
JOIN students   AS s ON s.student_id = e.student_id
WHERE c.title = 'Introduction to Databases'
ORDER BY s.last_name, s.first_name;

-- 3. Number of students per course
--    LEFT JOIN so a course with zero students would still show (count 0)
SELECT c.title, COUNT(e.enrolment_id) AS student_count
FROM courses AS c
LEFT JOIN enrolments AS e ON e.course_id = c.course_id
GROUP BY c.course_id, c.title
ORDER BY student_count DESC, c.title;

-- 4. Students who have no enrolments
SELECT s.student_id, s.first_name, s.last_name
FROM students AS s
LEFT JOIN enrolments AS e ON e.student_id = s.student_id
WHERE e.enrolment_id IS NULL;

-- 5. Update one enrolment's grade (Amina's Web Development Basics -> 'A')
UPDATE enrolments
SET grade = 'A'
WHERE student_id = (SELECT student_id FROM students WHERE email = 'amina.wanjiru@example.com')
  AND course_id  = (SELECT course_id  FROM courses  WHERE title = 'Web Development Basics');

-- Check the update worked
SELECT s.first_name, c.title, e.grade
FROM enrolments AS e
JOIN students AS s ON s.student_id = e.student_id
JOIN courses  AS c ON c.course_id  = e.course_id
WHERE s.email = 'amina.wanjiru@example.com';