-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "QType" AS ENUM ('MCQ', 'MULTI', 'TEXT', 'NUMERIC');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ONGOING', 'CLOSED');

-- CreateTable
CREATE TABLE "School" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "config" JSONB,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminSchoolId" INTEGER,
    "teacherSchoolId" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "matricNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "schoolId" INTEGER NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" INTEGER NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "durationMin" INTEGER,
    "shuffleQ" BOOLEAN NOT NULL DEFAULT true,
    "shuffleOpt" BOOLEAN NOT NULL DEFAULT true,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "showResult" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" INTEGER NOT NULL,
    "subjectId" INTEGER,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "durationMin" INTEGER,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "shuffleQ" BOOLEAN NOT NULL DEFAULT true,
    "shuffleOpt" BOOLEAN NOT NULL DEFAULT true,
    "showResult" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" INTEGER NOT NULL,
    "examId" INTEGER NOT NULL,
    "subjectId" INTEGER,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "type" "QType" NOT NULL,
    "mark" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "answerKey" JSONB,
    "gradingRule" JSONB,
    "examId" INTEGER,
    "testId" INTEGER,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "questionId" INTEGER NOT NULL,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "answers" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "graded" BOOLEAN NOT NULL DEFAULT false,
    "breakdown" JSONB,
    "analytics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" INTEGER NOT NULL,
    "examId" INTEGER,
    "testId" INTEGER,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" SERIAL NOT NULL,
    "average" DOUBLE PRECISION NOT NULL,
    "attempts" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,

    CONSTRAINT "Progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "id" SERIAL NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examId" INTEGER,
    "testId" INTEGER,
    "studentId" INTEGER NOT NULL,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" INTEGER NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_slug_key" ON "School"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_uuid_key" ON "User"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_matricNo_key" ON "Student"("matricNo");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_adminSchoolId_fkey" FOREIGN KEY ("adminSchoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teacherSchoolId_fkey" FOREIGN KEY ("teacherSchoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
