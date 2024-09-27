-- AlterTable
ALTER TABLE "School" ALTER COLUMN "address" SET DEFAULT 'no address available',
ALTER COLUMN "image" SET DEFAULT 'no image available',
ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "SchoolDetails" ALTER COLUMN "total_batches" SET DEFAULT 0,
ALTER COLUMN "total_papers" SET DEFAULT 0,
ALTER COLUMN "total_students" SET DEFAULT 0,
ALTER COLUMN "total_teachers" SET DEFAULT 0;
