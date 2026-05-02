-- Add FORCE_RESET_PASSWORD value to AdminAuditAction enum
-- Safe on PostgreSQL 12+; does not require rewriting existing rows.
ALTER TYPE "AdminAuditAction" ADD VALUE IF NOT EXISTS 'FORCE_RESET_PASSWORD' BEFORE 'APPROVE_REQUEST';
