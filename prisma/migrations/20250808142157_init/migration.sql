-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherName" TEXT NOT NULL,
    "teacherPhone" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "pdfUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "questions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "answers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" TEXT NOT NULL,
    "questionId" INTEGER NOT NULL,
    "userType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "answers_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "admins" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "answers_matchId_questionId_userType_key" ON "answers"("matchId", "questionId", "userType");

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");
