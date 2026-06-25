-- CreateTable
CREATE TABLE "flag_evaluation_metrics" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "environment_id" TEXT,
    "flag_id" TEXT,
    "project_key" VARCHAR(64) NOT NULL,
    "environment_key" VARCHAR(64) NOT NULL,
    "flag_key" VARCHAR(64) NOT NULL,
    "bucket_start" TIMESTAMPTZ(3) NOT NULL,
    "reason" VARCHAR(40) NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flag_evaluation_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flag_evaluation_metrics_project_key_environment_key_bucket__idx" ON "flag_evaluation_metrics"("project_key", "environment_key", "bucket_start");

-- CreateIndex
CREATE INDEX "flag_evaluation_metrics_project_key_flag_key_environment_ke_idx" ON "flag_evaluation_metrics"("project_key", "flag_key", "environment_key", "bucket_start");

-- CreateIndex
CREATE INDEX "flag_evaluation_metrics_project_id_idx" ON "flag_evaluation_metrics"("project_id");

-- CreateIndex
CREATE INDEX "flag_evaluation_metrics_environment_id_idx" ON "flag_evaluation_metrics"("environment_id");

-- CreateIndex
CREATE INDEX "flag_evaluation_metrics_flag_id_idx" ON "flag_evaluation_metrics"("flag_id");

-- CreateIndex
CREATE UNIQUE INDEX "flag_evaluation_metrics_bucket_key" ON "flag_evaluation_metrics"("project_key", "environment_key", "flag_key", "bucket_start", "reason", "enabled");

-- AddForeignKey
ALTER TABLE "flag_evaluation_metrics" ADD CONSTRAINT "flag_evaluation_metrics_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_evaluation_metrics" ADD CONSTRAINT "flag_evaluation_metrics_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_evaluation_metrics" ADD CONSTRAINT "flag_evaluation_metrics_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE SET NULL ON UPDATE CASCADE;
