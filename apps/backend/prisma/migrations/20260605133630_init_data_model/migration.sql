-- CreateEnum
CREATE TYPE "FeatureFlagLifecycleStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FlagConfigStatus" AS ENUM ('ENABLED', 'DISABLED');

-- CreateEnum
CREATE TYPE "ServingMode" AS ENUM ('GLOBAL_ON', 'TARGETED');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('USER_ALLOWLIST', 'ROLE_TARGETING', 'PERCENTAGE_ROLLOUT');

-- CreateEnum
CREATE TYPE "AuditTargetType" AS ENUM ('PROJECT', 'ENVIRONMENT', 'FEATURE_FLAG', 'FLAG_CONFIG', 'FLAG_RULE', 'SAMPLE_USER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED', 'ENVIRONMENT_CREATED', 'ENVIRONMENT_UPDATED', 'ENVIRONMENT_DELETED', 'FEATURE_FLAG_CREATED', 'FEATURE_FLAG_UPDATED', 'FEATURE_FLAG_ARCHIVED', 'FEATURE_FLAG_RESTORED', 'FEATURE_FLAG_DELETED', 'FLAG_CONFIG_CREATED', 'FLAG_CONFIG_UPDATED', 'FLAG_CONFIG_DELETED', 'FLAG_RULE_CREATED', 'FLAG_RULE_UPDATED', 'FLAG_RULE_DELETED', 'FLAG_RULES_REPLACED', 'SAMPLE_USER_CREATED', 'SAMPLE_USER_DELETED');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "lifecycle_status" "FeatureFlagLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flag_environment_configs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "flag_id" TEXT NOT NULL,
    "environment_id" TEXT NOT NULL,
    "status" "FlagConfigStatus" NOT NULL DEFAULT 'DISABLED',
    "serving_mode" "ServingMode" NOT NULL DEFAULT 'TARGETED',
    "kill_switch" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flag_environment_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flag_rules" (
    "id" TEXT NOT NULL,
    "flag_config_id" TEXT NOT NULL,
    "type" "RuleType" NOT NULL,
    "priority" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "parameters" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flag_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_user_contexts" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "display_name" VARCHAR(120) NOT NULL,
    "targeting_key" VARCHAR(120) NOT NULL,
    "user_id" VARCHAR(120),
    "roles" JSONB NOT NULL DEFAULT '[]',
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sample_user_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log_entries" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "project_key" VARCHAR(64) NOT NULL,
    "environment_id" TEXT,
    "environment_key" VARCHAR(64),
    "target_type" "AuditTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_key" VARCHAR(120),
    "action" "AuditAction" NOT NULL,
    "actor" VARCHAR(120) NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "request_id" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_key_key" ON "projects"("key");

-- CreateIndex
CREATE INDEX "environments_project_id_idx" ON "environments"("project_id");

-- CreateIndex
CREATE INDEX "environments_project_id_is_default_idx" ON "environments"("project_id", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "environments_project_id_key_key" ON "environments"("project_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "environments_project_id_id_key" ON "environments"("project_id", "id");

-- CreateIndex
CREATE INDEX "feature_flags_project_id_idx" ON "feature_flags"("project_id");

-- CreateIndex
CREATE INDEX "feature_flags_project_id_lifecycle_status_idx" ON "feature_flags"("project_id", "lifecycle_status");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_project_id_key_key" ON "feature_flags"("project_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_project_id_id_key" ON "feature_flags"("project_id", "id");

-- CreateIndex
CREATE INDEX "flag_environment_configs_project_id_environment_id_flag_id_idx" ON "flag_environment_configs"("project_id", "environment_id", "flag_id");

-- CreateIndex
CREATE INDEX "flag_environment_configs_environment_id_status_idx" ON "flag_environment_configs"("environment_id", "status");

-- CreateIndex
CREATE INDEX "flag_environment_configs_flag_id_idx" ON "flag_environment_configs"("flag_id");

-- CreateIndex
CREATE UNIQUE INDEX "flag_environment_configs_flag_id_environment_id_key" ON "flag_environment_configs"("flag_id", "environment_id");

-- CreateIndex
CREATE INDEX "flag_rules_flag_config_id_idx" ON "flag_rules"("flag_config_id");

-- CreateIndex
CREATE INDEX "flag_rules_flag_config_id_type_priority_idx" ON "flag_rules"("flag_config_id", "type", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "flag_rules_flag_config_id_priority_key" ON "flag_rules"("flag_config_id", "priority");

-- CreateIndex
CREATE INDEX "sample_user_contexts_project_id_idx" ON "sample_user_contexts"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "sample_user_contexts_project_id_targeting_key_key" ON "sample_user_contexts"("project_id", "targeting_key");

-- CreateIndex
CREATE INDEX "audit_log_entries_project_id_created_at_idx" ON "audit_log_entries"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_entries_project_key_created_at_idx" ON "audit_log_entries"("project_key", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_entries_environment_id_created_at_idx" ON "audit_log_entries"("environment_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_entries_project_id_environment_key_created_at_idx" ON "audit_log_entries"("project_id", "environment_key", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_entries_project_id_target_type_target_key_created_idx" ON "audit_log_entries"("project_id", "target_type", "target_key", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_entries_project_id_actor_created_at_idx" ON "audit_log_entries"("project_id", "actor", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_entries_project_id_action_created_at_idx" ON "audit_log_entries"("project_id", "action", "created_at");

-- AddForeignKey
ALTER TABLE "environments" ADD CONSTRAINT "environments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_environment_configs" ADD CONSTRAINT "flag_environment_configs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_environment_configs" ADD CONSTRAINT "flag_environment_configs_project_id_flag_id_fkey" FOREIGN KEY ("project_id", "flag_id") REFERENCES "feature_flags"("project_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_environment_configs" ADD CONSTRAINT "flag_environment_configs_project_id_environment_id_fkey" FOREIGN KEY ("project_id", "environment_id") REFERENCES "environments"("project_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_rules" ADD CONSTRAINT "flag_rules_flag_config_id_fkey" FOREIGN KEY ("flag_config_id") REFERENCES "flag_environment_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_user_contexts" ADD CONSTRAINT "sample_user_contexts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ManualConstraint
-- Ensure each project has at most one default environment.
CREATE UNIQUE INDEX "environments_one_default_per_project"
ON "environments" ("project_id")
WHERE "is_default" = true;

-- ManualConstraint
-- Audit log entries are append-only: inserts are allowed, updates/deletes are rejected.
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log_entries is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_entries_no_update
BEFORE UPDATE ON "audit_log_entries"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TRIGGER audit_log_entries_no_delete
BEFORE DELETE ON "audit_log_entries"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_mutation();