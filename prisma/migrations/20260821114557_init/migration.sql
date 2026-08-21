-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('instagram', 'telegram');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('comment_created', 'dm_received');

-- CreateEnum
CREATE TYPE "MatcherMode" AS ENUM ('exact', 'contains', 'regex', 'any');

-- CreateEnum
CREATE TYPE "ExecutionOriginType" AS ENUM ('rule', 'flow');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('pending', 'dispatched', 'running', 'succeeded', 'failed', 'dead_lettered');

-- CreateEnum
CREATE TYPE "TenureEndReason" AS ENUM ('transferred', 'revoked', 'closed_by_owner');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('active', 'needs_reauth', 'revoked');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "FlowSessionStatus" AS ENUM ('awaiting', 'completed', 'closed', 'timed_out');

-- CreateEnum
CREATE TYPE "ModerationState" AS ENUM ('pending', 'approved', 'restored');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "external_account_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_tenures" (
    "id" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "end_reason" "TenureEndReason",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_tenures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_transfers" (
    "id" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "from_tenure_id" TEXT,
    "to_user_id" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'pending',
    "objection_deadline_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "account_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_policies" (
    "id" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "data_class" TEXT NOT NULL,
    "ttl_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_connections" (
    "id" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "access_token_encrypted" TEXT NOT NULL,
    "refresh_token_encrypted" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "capabilities" TEXT[],
    "status" "ConnectionStatus" NOT NULL DEFAULT 'active',
    "authorized_by_user_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "monthly_message_quota" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "purchased_by_user_id" TEXT NOT NULL,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "grace_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quota_counters" (
    "id" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quota_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "trigger_type" "EventType" NOT NULL,
    "trigger_scope" JSONB,
    "matcher_mode" "MatcherMode" NOT NULL,
    "matcher_values" TEXT[],
    "matcher_case_sensitive" BOOLEAN NOT NULL DEFAULT false,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "executions" (
    "id" TEXT NOT NULL,
    "origin_type" "ExecutionOriginType" NOT NULL,
    "origin_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "action_index" INTEGER NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'pending',
    "action_type" TEXT NOT NULL,
    "action_params" JSONB NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "next_attempt_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "dead_letter_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flows" (
    "id" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flow_versions" (
    "id" TEXT NOT NULL,
    "flow_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "graph" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flow_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flow_sessions" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "flow_version_id" TEXT NOT NULL,
    "status" "FlowSessionStatus" NOT NULL DEFAULT 'awaiting',
    "current_step_id" TEXT NOT NULL,
    "context" JSONB NOT NULL DEFAULT '{}',
    "reprompt_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flow_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbound_events" (
    "id" TEXT NOT NULL,
    "tenure_id" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "type" "EventType" NOT NULL,
    "external_id" TEXT NOT NULL,
    "dedupe_key" TEXT NOT NULL,
    "author_external_id" TEXT NOT NULL,
    "author_ref_hash" TEXT NOT NULL,
    "raw_text" TEXT NOT NULL,
    "normalized_text" TEXT NOT NULL,
    "normalizer_version" INTEGER NOT NULL,
    "context" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inbound_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "tenure_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "participant_hash" TEXT NOT NULL,
    "window_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "inbound_event_id" TEXT,
    "raw_text" TEXT NOT NULL,
    "normalized_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_decisions" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "state" "ModerationState" NOT NULL DEFAULT 'pending',
    "score" DOUBLE PRECISION,
    "reasons" TEXT[],
    "decided_by_user_id" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_platform_external_account_id_key" ON "social_accounts"("platform", "external_account_id");

-- CreateIndex
CREATE INDEX "account_tenures_social_account_id_idx" ON "account_tenures"("social_account_id");

-- CreateIndex
CREATE INDEX "account_tenures_user_id_idx" ON "account_tenures"("user_id");

-- CreateIndex (hand-added: Prisma schema can't express a filtered unique constraint —
-- see the comment on the AccountTenure model in schema.prisma)
CREATE UNIQUE INDEX "account_tenures_one_active_per_social_account" ON "account_tenures"("social_account_id") WHERE "ended_at" IS NULL;

-- CreateIndex
CREATE INDEX "account_transfers_social_account_id_idx" ON "account_transfers"("social_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "retention_policies_social_account_id_data_class_key" ON "retention_policies"("social_account_id", "data_class");

-- CreateIndex
CREATE INDEX "channel_connections_social_account_id_idx" ON "channel_connections"("social_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE INDEX "subscriptions_social_account_id_idx" ON "subscriptions"("social_account_id");

-- CreateIndex (hand-added: Prisma schema can't express a filtered unique constraint —
-- see the comment on the Subscription model in schema.prisma)
CREATE UNIQUE INDEX "subscriptions_one_active_per_social_account" ON "subscriptions"("social_account_id") WHERE "status" = 'active';

-- CreateIndex
CREATE UNIQUE INDEX "quota_counters_social_account_id_metric_period_start_key" ON "quota_counters"("social_account_id", "metric", "period_start");

-- CreateIndex
CREATE INDEX "rules_social_account_id_idx" ON "rules"("social_account_id");

-- CreateIndex
CREATE INDEX "executions_status_next_attempt_at_idx" ON "executions"("status", "next_attempt_at");

-- CreateIndex
CREATE UNIQUE INDEX "executions_origin_type_origin_id_event_id_action_index_key" ON "executions"("origin_type", "origin_id", "event_id", "action_index");

-- CreateIndex
CREATE INDEX "flows_social_account_id_idx" ON "flows"("social_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "flow_versions_flow_id_version_key" ON "flow_versions"("flow_id", "version");

-- CreateIndex
CREATE INDEX "flow_sessions_conversation_id_idx" ON "flow_sessions"("conversation_id");

-- CreateIndex (hand-added: Prisma schema can't express a filtered unique constraint —
-- see the comment on the FlowSession model in schema.prisma)
CREATE UNIQUE INDEX "flow_sessions_one_awaiting_per_conversation" ON "flow_sessions"("conversation_id") WHERE "status" = 'awaiting';

-- CreateIndex
CREATE UNIQUE INDEX "inbound_events_dedupe_key_key" ON "inbound_events"("dedupe_key");

-- CreateIndex
CREATE INDEX "inbound_events_tenure_id_idx" ON "inbound_events"("tenure_id");

-- CreateIndex
CREATE INDEX "inbound_events_social_account_id_idx" ON "inbound_events"("social_account_id");

-- CreateIndex
CREATE INDEX "conversations_tenure_id_participant_hash_idx" ON "conversations"("tenure_id", "participant_hash");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_decisions_event_id_key" ON "moderation_decisions"("event_id");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");

-- AddForeignKey
ALTER TABLE "account_tenures" ADD CONSTRAINT "account_tenures_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "social_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_transfers" ADD CONSTRAINT "account_transfers_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "social_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retention_policies" ADD CONSTRAINT "retention_policies_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "social_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow_versions" ADD CONSTRAINT "flow_versions_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "flows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow_sessions" ADD CONSTRAINT "flow_sessions_flow_version_id_fkey" FOREIGN KEY ("flow_version_id") REFERENCES "flow_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
