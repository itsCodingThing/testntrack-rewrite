/*
  Warnings:

  - The `dob` column on the `Student` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Student" DROP COLUMN "dob",
ADD COLUMN     "dob" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "rollNo" SET DEFAULT '',
ALTER COLUMN "image" SET DEFAULT 'https://picsum.photos/200';
