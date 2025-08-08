-- CreateTable
CREATE TABLE "public"."matches" (
    "id" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "teacherPhone" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teachers_questions" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "tone" TEXT DEFAULT 'student_style',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."students_questions" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "tone" TEXT DEFAULT 'teacher_style',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."answers" (
    "id" SERIAL NOT NULL,
    "matchId" TEXT NOT NULL,
    "teachersQuestionId" INTEGER,
    "studentsQuestionId" INTEGER,
    "userType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admins" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_role_name_key" ON "public"."categories"("role", "name");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_questions_categoryId_questionText_key" ON "public"."teachers_questions"("categoryId", "questionText");

-- CreateIndex
CREATE UNIQUE INDEX "students_questions_categoryId_questionText_key" ON "public"."students_questions"("categoryId", "questionText");

-- CreateIndex
CREATE UNIQUE INDEX "answers_matchId_teachersQuestionId_studentsQuestionId_userT_key" ON "public"."answers"("matchId", "teachersQuestionId", "studentsQuestionId", "userType");

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "public"."admins"("username");

-- AddForeignKey
ALTER TABLE "public"."teachers_questions" ADD CONSTRAINT "teachers_questions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students_questions" ADD CONSTRAINT "students_questions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."answers" ADD CONSTRAINT "answers_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."answers" ADD CONSTRAINT "answers_teachersQuestionId_fkey" FOREIGN KEY ("teachersQuestionId") REFERENCES "public"."teachers_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."answers" ADD CONSTRAINT "answers_studentsQuestionId_fkey" FOREIGN KEY ("studentsQuestionId") REFERENCES "public"."students_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
