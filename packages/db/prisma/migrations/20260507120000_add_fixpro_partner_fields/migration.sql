-- Add admin audit action for FixPro Partner management
ALTER TYPE "AdminAuditAction" ADD VALUE 'SET_FIXPRO_PARTNER';

-- Add FixPro Partner fields to companies
ALTER TABLE "companies"
ADD COLUMN "isFixProPartner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "fixProPartnerRank" INTEGER,
ADD COLUMN "fixProPartnerSince" TIMESTAMP(3);

-- Support ordered partner listings
CREATE INDEX "companies_isFixProPartner_fixProPartnerRank_idx"
ON "companies"("isFixProPartner", "fixProPartnerRank");
