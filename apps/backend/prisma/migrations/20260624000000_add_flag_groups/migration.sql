-- AlterEnum
ALTER TYPE "AuditTargetType" ADD VALUE 'FLAG_GROUP';

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'FEATURE_FLAG_GROUP_ASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE 'FEATURE_FLAG_GROUP_UNASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE 'FLAG_GROUP_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'FLAG_GROUP_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'FLAG_GROUP_KILL_SWITCH_UPDATED';

-- AlterTable
ALTER TABLE "feature_flags" ADD COLUMN "group_id" TEXT;

-- CreateTable
CREATE TABLE "flag_groups" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flag_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flag_group_configs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "environment_id" TEXT NOT NULL,
    "kill_switch" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flag_group_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feature_flags_group_id_idx" ON "feature_flags"("group_id");

-- CreateIndex
CREATE INDEX "flag_groups_project_id_idx" ON "flag_groups"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "flag_groups_project_id_key_key" ON "flag_groups"("project_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "flag_groups_project_id_id_key" ON "flag_groups"("project_id", "id");

-- CreateIndex
CREATE INDEX "flag_group_configs_project_id_environment_id_idx" ON "flag_group_configs"("project_id", "environment_id");

-- CreateIndex
CREATE INDEX "flag_group_configs_group_id_idx" ON "flag_group_configs"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "flag_group_configs_group_id_environment_id_key" ON "flag_group_configs"("group_id", "environment_id");

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_project_id_group_id_fkey" FOREIGN KEY ("project_id", "group_id") REFERENCES "flag_groups"("project_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_groups" ADD CONSTRAINT "flag_groups_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_group_configs" ADD CONSTRAINT "flag_group_configs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_group_configs" ADD CONSTRAINT "flag_group_configs_project_id_group_id_fkey" FOREIGN KEY ("project_id", "group_id") REFERENCES "flag_groups"("project_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_group_configs" ADD CONSTRAINT "flag_group_configs_project_id_environment_id_fkey" FOREIGN KEY ("project_id", "environment_id") REFERENCES "environments"("project_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
