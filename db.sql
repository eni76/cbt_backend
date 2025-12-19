-- ==========================
-- ENUMS as TEXT
-- ==========================

-- Roles, QType, ExamStatus will be TEXT in the tables

-- ==========================
-- SCHOOL
-- ==========================
CREATE TABLE school (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    image TEXT,
    description TEXT,
    verified BOOLEAN DEFAULT FALSE,
    password TEXT NOT NULL
);

-- ==========================
-- PROFILE
-- ==========================
CREATE TABLE profile (
    id SERIAL PRIMARY KEY,
    uuid TEXT UNIQUE DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    firstname TEXT,
    lastname TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    image TEXT,
    identification TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    school_id INT REFERENCES school(id) ON DELETE CASCADE,
    
    created_by_admin_id INT REFERENCES profile(id),
    created_by_teacher_id INT REFERENCES profile(id)
);

-- ==========================
-- SUBJECT
-- ==========================
CREATE TABLE subject (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    school_id INT REFERENCES school(id) ON DELETE CASCADE,
    created_by_id INT REFERENCES profile(id) ON DELETE SET NULL
);

-- ==========================
-- EXAM
-- ==========================
CREATE TABLE exam (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'DRAFT',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_min INT,
    shuffle_q BOOLEAN DEFAULT TRUE,
    shuffle_opt BOOLEAN DEFAULT TRUE,
    max_attempts INT DEFAULT 1,
    show_result BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_by_id INT REFERENCES profile(id),
    school_id INT REFERENCES school(id),
    subject_id INT REFERENCES subject(id)
);

-- ==========================
-- TEST
-- ==========================
CREATE TABLE test (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'DRAFT',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_min INT,
    max_attempts INT DEFAULT 1,
    shuffle_q BOOLEAN DEFAULT TRUE,
    shuffle_opt BOOLEAN DEFAULT TRUE,
    show_result BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_by_id INT REFERENCES profile(id),
    school_id INT REFERENCES school(id),
    exam_id INT REFERENCES exam(id),
    subject_id INT REFERENCES subject(id)
);

-- ==========================
-- QUESTION
-- ==========================
CREATE TABLE question (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    type TEXT NOT NULL,
    mark FLOAT DEFAULT 1,
    answer_key JSON,
    grading_rule JSON,
    
    exam_id INT REFERENCES exam(id),
    test_id INT REFERENCES test(id)
);

-- ==========================
-- OPTION
-- ==========================
CREATE TABLE IF NOT EXISTS option (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    
    question_id INT REFERENCES question(id) ON DELETE CASCADE
);

-- ==========================
-- SUBMISSION
-- ==========================
CREATE TABLE submission (
    id SERIAL PRIMARY KEY,
    answers JSON NOT NULL,
    score FLOAT,
    graded BOOLEAN DEFAULT FALSE,
    breakdown JSON,
    analytics JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    student_id INT REFERENCES profile(id),
    exam_id INT REFERENCES exam(id),
    test_id INT REFERENCES test(id)
);

-- ==========================
-- PROGRESS
-- ==========================
CREATE TABLE progress (
    id SERIAL PRIMARY KEY,
    average FLOAT NOT NULL,
    attempts INT NOT NULL,
    
    student_id INT REFERENCES profile(id),
    subject_id INT REFERENCES subject(id)
);

-- ==========================
-- LEADERBOARD
-- ==========================
CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY,
    score FLOAT NOT NULL,
    rank INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    exam_id INT REFERENCES exam(id),
    test_id INT REFERENCES test(id),
    student_id INT REFERENCES profile(id)
);

-- ==========================
-- ACTIVITY LOG
-- ==========================
CREATE TABLE activity_log (
    id SERIAL PRIMARY KEY,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    profile_id INT REFERENCES profile(id)
);

-- ==========================
-- PAYMENT
-- ==========================
CREATE TABLE payment (
    id SERIAL PRIMARY KEY,
    amount FLOAT NOT NULL,
    currency TEXT NOT NULL,
    reference TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    school_id INT REFERENCES school(id)
);
