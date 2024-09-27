-- CreateTable
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "contact" TEXT NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "schoolDetailsId" INTEGER NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolAdminUser" (
    "id" SERIAL NOT NULL,
    "schoolId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "contact" TEXT NOT NULL,

    CONSTRAINT "SchoolAdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolDetails" (
    "id" INTEGER NOT NULL,
    "total_batches" INTEGER NOT NULL,
    "total_papers" INTEGER NOT NULL,
    "total_students" INTEGER NOT NULL,
    "total_teachers" INTEGER NOT NULL,

    CONSTRAINT "SchoolDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolAdminUser_email_key" ON "SchoolAdminUser"("email");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_schoolDetailsId_fkey" FOREIGN KEY ("schoolDetailsId") REFERENCES "SchoolDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolAdminUser" ADD CONSTRAINT "SchoolAdminUser_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
