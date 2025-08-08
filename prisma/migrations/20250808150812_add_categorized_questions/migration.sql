/*
  Warnings:

  - You are about to drop the `questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `questionId` on the `answers` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "questions";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "teachers_questions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryId" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "tone" TEXT DEFAULT 'student_style',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "teachers_questions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "students_questions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryId" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "tone" TEXT DEFAULT 'teacher_style',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "students_questions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_answers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" TEXT NOT NULL,
    "teachersQuestionId" INTEGER,
    "studentsQuestionId" INTEGER,
    "userType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "answers_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "answers_teachersQuestionId_fkey" FOREIGN KEY ("teachersQuestionId") REFERENCES "teachers_questions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "answers_studentsQuestionId_fkey" FOREIGN KEY ("studentsQuestionId") REFERENCES "students_questions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_answers" ("content", "createdAt", "id", "matchId", "userType") SELECT "content", "createdAt", "id", "matchId", "userType" FROM "answers";
DROP TABLE "answers";
ALTER TABLE "new_answers" RENAME TO "answers";
CREATE UNIQUE INDEX "answers_matchId_teachersQuestionId_studentsQuestionId_userType_key" ON "answers"("matchId", "teachersQuestionId", "studentsQuestionId", "userType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "categories_role_name_key" ON "categories"("role", "name");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_questions_categoryId_questionText_key" ON "teachers_questions"("categoryId", "questionText");

-- CreateIndex
CREATE UNIQUE INDEX "students_questions_categoryId_questionText_key" ON "students_questions"("categoryId", "questionText");
