-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "AdminAuditAction" AS ENUM ('LOGIN', 'INVITE_ADMIN', 'REVOKE_ADMIN', 'CHANGE_ADMIN_ROLE', 'FORCE_RESET_PASSWORD', 'APPROVE_REQUEST', 'REJECT_REQUEST', 'APPROVE_RESCUE', 'REJECT_RESCUE', 'ASSIGN_SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "ProductRole" AS ENUM ('CLIENT', 'COMPANY');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CompanyWorkType" AS ENUM ('SMALL', 'FULL', 'BOTH');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RequestWorkType" AS ENUM ('SMALL', 'FULL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RescueStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CreditMovementType" AS ENUM ('PURCHASE', 'SPEND', 'REFUND', 'BONUS', 'EXPIRY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_REQUEST_IN_ZONE', 'CREDITS_LOW', 'CREDITS_EXPIRING', 'RESCUE_APPROVED', 'RESCUE_REJECTED', 'ADMIN_MESSAGE', 'CLIENT_MESSAGE', 'PROMO_REQUEST');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "MessageSenderType" AS ENUM ('CLIENT', 'COMPANY', 'ADMIN');

-- CreateEnum
CREATE TYPE "RequestPurchaseMethod" AS ENUM ('CREDITS', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "RequestSlotReservationStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ShowcasePlanTier" AS ENUM ('BASE', 'PLUS', 'PRO');

-- CreateEnum
CREATE TYPE "ShowcaseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContactSourceType" AS ENUM ('MARKETPLACE_REQUEST', 'SHOWCASE_PROFILE', 'SHOWCASE_LISTING', 'SHOWCASE_HOME_BLOCK', 'SHOWCASE_CLIENT_DASHBOARD', 'SHOWCASE_CATEGORY_PAGE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminRole" "AdminRole",
    "adminSessionInvalidatedAt" TIMESTAMP(3),
    "role" "ProductRole" NOT NULL DEFAULT 'CLIENT',
    "phoneNumber" TEXT,
    "phoneNumberVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settori" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descrizione" TEXT,
    "fase" TEXT NOT NULL,
    "ordine" INTEGER NOT NULL DEFAULT 0,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorie" (
    "id" TEXT NOT NULL,
    "settoreId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descrizione" TEXT,
    "alias" TEXT[],
    "searchTerms" TEXT[],
    "ordine" INTEGER NOT NULL DEFAULT 0,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servizi" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descrizione" TEXT,
    "alias" TEXT[],
    "searchTerms" TEXT[],
    "ordine" INTEGER NOT NULL DEFAULT 0,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servizi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interventi" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descrizione" TEXT,
    "alias" TEXT[],
    "searchTerms" TEXT[],
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "ordine" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interventi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matching_intervento_cat" (
    "interventoId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "priorita" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matching_intervento_cat_pkey" PRIMARY KEY ("interventoId","categoriaId")
);

-- CreateTable
CREATE TABLE "matching_intervento_servizio" (
    "interventoId" TEXT NOT NULL,
    "servizioId" TEXT NOT NULL,
    "priorita" INTEGER NOT NULL DEFAULT 0,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matching_intervento_servizio_pkey" PRIMARY KEY ("interventoId","servizioId")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ragioneSociale" TEXT NOT NULL,
    "partitaIva" TEXT,
    "description" TEXT,
    "descriptionExtended" TEXT,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "galleryImages" TEXT[],
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "streetNumber" TEXT,
    "city" TEXT,
    "province" TEXT,
    "cap" TEXT,
    "googlePlaceId" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "radiusKm" INTEGER NOT NULL DEFAULT 30,
    "workType" "CompanyWorkType" NOT NULL DEFAULT 'BOTH',
    "notificationEmail" BOOLEAN NOT NULL DEFAULT true,
    "notificationWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "status" "CompanyStatus" NOT NULL DEFAULT 'PENDING',
    "suspendedReason" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_categories" (
    "companyId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,

    CONSTRAINT "company_categories_pkey" PRIMARY KEY ("companyId","categoriaId")
);

-- CreateTable
CREATE TABLE "company_services" (
    "companyId" TEXT NOT NULL,
    "servizioId" TEXT NOT NULL,

    CONSTRAINT "company_services_pkey" PRIMARY KEY ("companyId","servizioId")
);

-- CreateTable
CREATE TABLE "company_portfolio_images" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_portfolio_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "servizioId" TEXT,
    "workType" "RequestWorkType" NOT NULL DEFAULT 'UNKNOWN',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cap" TEXT,
    "address" TEXT,
    "streetNumber" TEXT,
    "city" TEXT,
    "province" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "propertyType" TEXT,
    "urgency" TEXT,
    "hasImages" BOOLEAN NOT NULL DEFAULT false,
    "intention" TEXT,
    "contactName" TEXT,
    "contactSurname" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "creditCost" INTEGER,
    "oneTimePriceCents" INTEGER,
    "maxBuyers" INTEGER DEFAULT 3,
    "expiresAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "targetCompanyId" TEXT,
    "interventoId" TEXT,
    "privacyConsentAt" TIMESTAMP(3),
    "privacyConsentVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_images" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_purchases" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "paymentMethod" "RequestPurchaseMethod" NOT NULL DEFAULT 'CREDITS',
    "contactSourceType" "ContactSourceType" NOT NULL DEFAULT 'MARKETPLACE_REQUEST',
    "creditSpent" INTEGER NOT NULL DEFAULT 0,
    "stripePaymentIntentId" TEXT,
    "amountCents" INTEGER,
    "baseAmountCents" INTEGER,
    "baseCreditCost" INTEGER,
    "finalCreditCost" INTEGER,
    "discountPercent" INTEGER,
    "discountReason" TEXT,
    "planSnapshot" JSONB,
    "pricingContext" JSONB,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "senderType" "MessageSenderType" NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "description" TEXT,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_balances" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_batches" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "remaining" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_movements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "batchId" TEXT,
    "type" "CreditMovementType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rescues" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RescueStatus" NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rescues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rescue_audits" (
    "id" TEXT NOT NULL,
    "rescueId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rescue_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistance_messages" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "senderType" "MessageSenderType" NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistance_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "coverImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showcase_plans" (
    "id" TEXT NOT NULL,
    "tier" "ShowcasePlanTier" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPriceCents" INTEGER NOT NULL,
    "yearlyPriceCents" INTEGER,
    "discountPercent" INTEGER NOT NULL,
    "freeContactsPerMonth" INTEGER NOT NULL DEFAULT 0,
    "overQuotaDiscountPercent" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "showcase_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showcase_subscriptions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "ShowcaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "showcase_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_webhook_events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_slot_reservations" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "RequestSlotReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_slot_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_providerId_accountId_key" ON "accounts"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "settori_nome_key" ON "settori"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "settori_slug_key" ON "settori"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categorie_slug_key" ON "categorie"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categorie_settoreId_nome_key" ON "categorie"("settoreId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "servizi_slug_key" ON "servizi"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "servizi_categoriaId_nome_key" ON "servizi"("categoriaId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "interventi_nome_key" ON "interventi"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "interventi_slug_key" ON "interventi"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "companies_userId_key" ON "companies"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "companies_partitaIva_key" ON "companies"("partitaIva");

-- CreateIndex
CREATE INDEX "company_portfolio_images_companyId_createdAt_idx" ON "company_portfolio_images"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "service_requests_status_expiresAt_idx" ON "service_requests"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "service_requests_clientId_idx" ON "service_requests"("clientId");

-- CreateIndex
CREATE INDEX "service_requests_targetCompanyId_idx" ON "service_requests"("targetCompanyId");

-- CreateIndex
CREATE INDEX "service_requests_province_idx" ON "service_requests"("province");

-- CreateIndex
CREATE INDEX "request_images_requestId_createdAt_idx" ON "request_images"("requestId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "request_purchases_stripePaymentIntentId_key" ON "request_purchases"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "request_purchases_companyId_purchasedAt_idx" ON "request_purchases"("companyId", "purchasedAt");

-- CreateIndex
CREATE INDEX "request_purchases_requestId_idx" ON "request_purchases"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "request_purchases_companyId_requestId_key" ON "request_purchases"("companyId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "credit_balances_companyId_key" ON "credit_balances"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "credit_batches_stripePaymentIntentId_key" ON "credit_batches"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "credit_batches_companyId_remaining_expiresAt_idx" ON "credit_batches"("companyId", "remaining", "expiresAt");

-- CreateIndex
CREATE INDEX "credit_movements_companyId_idx" ON "credit_movements"("companyId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "showcase_plans_tier_key" ON "showcase_plans"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "showcase_subscriptions_companyId_key" ON "showcase_subscriptions"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "showcase_subscriptions_stripePaymentIntentId_key" ON "showcase_subscriptions"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "showcase_subscriptions_status_expiresAt_idx" ON "showcase_subscriptions"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "request_slot_reservations_requestId_status_idx" ON "request_slot_reservations"("requestId", "status");

-- CreateIndex
CREATE INDEX "request_slot_reservations_status_expiresAt_idx" ON "request_slot_reservations"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "request_slot_reservations_companyId_requestId_key" ON "request_slot_reservations"("companyId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_purchaseId_key" ON "reviews"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_audit_logs_idempotencyKey_key" ON "admin_audit_logs"("idempotencyKey");

-- CreateIndex
CREATE INDEX "admin_audit_logs_adminId_idx" ON "admin_audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "admin_audit_logs_createdAt_idx" ON "admin_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_logs_idempotencyKey_idx" ON "admin_audit_logs"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorie" ADD CONSTRAINT "categorie_settoreId_fkey" FOREIGN KEY ("settoreId") REFERENCES "settori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servizi" ADD CONSTRAINT "servizi_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching_intervento_cat" ADD CONSTRAINT "matching_intervento_cat_interventoId_fkey" FOREIGN KEY ("interventoId") REFERENCES "interventi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching_intervento_cat" ADD CONSTRAINT "matching_intervento_cat_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching_intervento_servizio" ADD CONSTRAINT "matching_intervento_servizio_interventoId_fkey" FOREIGN KEY ("interventoId") REFERENCES "interventi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching_intervento_servizio" ADD CONSTRAINT "matching_intervento_servizio_servizioId_fkey" FOREIGN KEY ("servizioId") REFERENCES "servizi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_categories" ADD CONSTRAINT "company_categories_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_categories" ADD CONSTRAINT "company_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_services" ADD CONSTRAINT "company_services_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_services" ADD CONSTRAINT "company_services_servizioId_fkey" FOREIGN KEY ("servizioId") REFERENCES "servizi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_portfolio_images" ADD CONSTRAINT "company_portfolio_images_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_servizioId_fkey" FOREIGN KEY ("servizioId") REFERENCES "servizi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_targetCompanyId_fkey" FOREIGN KEY ("targetCompanyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_interventoId_fkey" FOREIGN KEY ("interventoId") REFERENCES "interventi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_images" ADD CONSTRAINT "request_images_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_purchases" ADD CONSTRAINT "request_purchases_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_purchases" ADD CONSTRAINT "request_purchases_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "request_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_balances" ADD CONSTRAINT "credit_balances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_batches" ADD CONSTRAINT "credit_batches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_movements" ADD CONSTRAINT "credit_movements_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "credit_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_movements" ADD CONSTRAINT "credit_movements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescues" ADD CONSTRAINT "rescues_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescues" ADD CONSTRAINT "rescues_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescue_audits" ADD CONSTRAINT "rescue_audits_rescueId_fkey" FOREIGN KEY ("rescueId") REFERENCES "rescues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistance_messages" ADD CONSTRAINT "assistance_messages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistance_messages" ADD CONSTRAINT "assistance_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_subscriptions" ADD CONSTRAINT "showcase_subscriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_subscriptions" ADD CONSTRAINT "showcase_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "showcase_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "request_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
