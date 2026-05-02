CREATE TYPE "CompanyWorkType" AS ENUM ('SMALL', 'FULL', 'BOTH');
CREATE TYPE "RequestWorkType" AS ENUM ('SMALL', 'FULL', 'UNKNOWN');

ALTER TABLE "companies"
ADD COLUMN "workType" "CompanyWorkType" NOT NULL DEFAULT 'BOTH';

ALTER TABLE "service_requests"
ADD COLUMN "workType" "RequestWorkType" NOT NULL DEFAULT 'UNKNOWN';
