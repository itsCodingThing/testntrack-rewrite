/*
  Warnings:

  - You are about to drop the column `schoolDetailsId` on the `School` table. All the data in the column will be lost.
  - The primary key for the `SchoolDetails` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `SchoolDetails` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[schoolId]` on the table `SchoolDetails` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `schoolId` to the `SchoolDetails` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "School" DROP CONSTRAINT "School_schoolDetailsId_fkey";

-- AlterTable
ALTER TABLE "School" DROP COLUMN "schoolDetailsId";

-- AlterTable
ALTER TABLE "SchoolDetails" DROP CONSTRAINT "SchoolDetails_pkey",
DROP COLUMN "id",
ADD COLUMN     "schoolId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SchoolDetails_schoolId_key" ON "SchoolDetails"("schoolId");

-- AddForeignKey
ALTER TABLE "SchoolDetails" ADD CONSTRAINT "SchoolDetails_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
