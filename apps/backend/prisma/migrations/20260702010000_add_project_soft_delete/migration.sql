-- AlterTable
ALTER TABLE "projects" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN "deleted_by" VARCHAR(120);

-- AlterTable
ALTER TABLE "feature_flags" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "feature_flags" ADD COLUMN "deleted_by" VARCHAR(120);

-- CreateIndex
CREATE INDEX "projects_deleted_at_idx" ON "projects"("deleted_at");

-- CreateIndex
CREATE INDEX "feature_flags_project_id_deleted_at_idx" ON "feature_flags"("project_id", "deleted_at");
