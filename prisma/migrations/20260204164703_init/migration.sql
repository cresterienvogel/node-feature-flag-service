-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('dev', 'staging', 'prod');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('global', 'percentage', 'segment', 'variant');

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "environment" "Environment" NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "rulesVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "ruleType" "RuleType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rolloutPercent" INTEGER,
    "variants" JSONB,
    "conditions" JSONB,
    "schedule" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" BIGSERIAL NOT NULL,
    "actorApiKeyId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" BIGSERIAL NOT NULL,
    "featureKey" TEXT NOT NULL,
    "environment" "Environment" NOT NULL,
    "subjectKey" TEXT NOT NULL,
    "subject" JSONB NOT NULL,
    "resultEnabled" BOOLEAN NOT NULL,
    "variantKey" TEXT,
    "matchedRuleId" TEXT,
    "reason" TEXT NOT NULL,
    "decisionHash" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_prefix_key" ON "ApiKey"("prefix");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_revokedAt_idx" ON "ApiKey"("revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_key_key" ON "Feature"("key");

-- CreateIndex
CREATE INDEX "Feature_environment_idx" ON "Feature"("environment");

-- CreateIndex
CREATE INDEX "Rule_featureId_priority_idx" ON "Rule"("featureId", "priority");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Evaluation_featureKey_environment_idx" ON "Evaluation"("featureKey", "environment");

-- CreateIndex
CREATE INDEX "Evaluation_subjectKey_idx" ON "Evaluation"("subjectKey");

-- CreateIndex
CREATE INDEX "Evaluation_createdAt_idx" ON "Evaluation"("createdAt");

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
