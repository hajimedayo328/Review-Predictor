-- AlterTable
ALTER TABLE "ideas" ADD COLUMN     "parentId" INTEGER,
ADD COLUMN     "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ideas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
