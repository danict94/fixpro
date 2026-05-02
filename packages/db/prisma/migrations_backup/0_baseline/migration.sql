-- FixPro Admin Role System Baseline Migration
-- Adds AdminRole enum, AdminInviteToken, AdminAuditLog, and session invalidation field

-- CreateEnum AdminRole
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- CreateEnum AdminAuditAction
CREATE TYPE "AdminAuditAction" AS ENUM ('LOGIN', 'INVITE_ADMIN', 'REVOKE_ADMIN', 'CHANGE_ADMIN_ROLE', 'APPROVE_REQUEST', 'REJECT_REQUEST', 'APPROVE_RESCUE', 'REJECT_RESCUE', 'ASSIGN_SUBSCRIPTION');

-- AlterTable users
ALTER TABLE "users" 
ADD COLUMN "adminRole" "AdminRole",
ADD COLUMN "adminSessionInvalidatedAt" TIMESTAMP(3);

-- CreateTable admin_invite_tokens
CREATE TABLE "admin_invite_tokens" (
    "id" TEXT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "usedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_invite_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable admin_audit_logs
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "AdminAuditAction" NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "meta" JSONB,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex admin_invite_tokens
CREATE UNIQUE INDEX "admin_invite_tokens_token_key" ON "admin_invite_tokens"("token");
CREATE UNIQUE INDEX "admin_invite_tokens_email_used_key" ON "admin_invite_tokens"("email", "used");
CREATE INDEX "admin_invite_tokens_email_idx" ON "admin_invite_tokens"("email");
CREATE INDEX "admin_invite_tokens_expiresAt_idx" ON "admin_invite_tokens"("expiresAt");
CREATE INDEX "admin_invite_tokens_createdAt_idx" ON "admin_invite_tokens"("createdAt");

-- CreateIndex admin_audit_logs
CREATE UNIQUE INDEX "admin_audit_logs_idempotencyKey_key" ON "admin_audit_logs"("idempotencyKey");
CREATE INDEX "admin_audit_logs_adminId_idx" ON "admin_audit_logs"("adminId");
CREATE INDEX "admin_audit_logs_createdAt_idx" ON "admin_audit_logs"("createdAt");
CREATE INDEX "admin_audit_logs_idempotencyKey_idx" ON "admin_audit_logs"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "admin_invite_tokens" ADD CONSTRAINT "admin_invite_tokens_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
