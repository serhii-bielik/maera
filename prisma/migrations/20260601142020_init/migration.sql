-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "RotationType" AS ENUM ('SEQUENTIAL', 'WEIGHTED');

-- CreateEnum
CREATE TYPE "FlowType" AS ENUM ('URL', 'ACTION');

-- CreateEnum
CREATE TYPE "RedirectType" AS ENUM ('HTTP_301', 'HTTP_302', 'META', 'JS');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('NOT_FOUND', 'FORBIDDEN', 'SHOW_HTML', 'SHOW_TEXT');

-- CreateEnum
CREATE TYPE "FilterType" AS ENUM ('COUNTRY', 'LANGUAGE', 'USER_AGENT', 'BOT', 'UNIQUE', 'GEO_GROUP', 'IP', 'DEVICE_TYPE', 'OS');

-- CreateEnum
CREATE TYPE "FilterMode" AS ENUM ('IS', 'IS_NOT');

-- CreateEnum
CREATE TYPE "FilterLogic" AS ENUM ('AND', 'OR');

-- CreateEnum
CREATE TYPE "UniquenessType" AS ENUM ('IP_USER_AGENT', 'IP_ONLY', 'PARAMETER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "groupId" TEXT,
    "rotation" "RotationType" NOT NULL DEFAULT 'SEQUENTIAL',
    "uniqueness" "UniquenessType" NOT NULL DEFAULT 'IP_USER_AGENT',
    "uniquenessTtl" INTEGER NOT NULL DEFAULT 24,
    "useCookies" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignUser" (
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CampaignUser_pkey" PRIMARY KEY ("campaignId","userId")
);

-- CreateTable
CREATE TABLE "Flow" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FlowType" NOT NULL DEFAULT 'URL',
    "position" INTEGER NOT NULL DEFAULT 0,
    "weight" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "collectClicks" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "url" TEXT,
    "redirectType" "RedirectType",
    "action" "ActionType",
    "actionContent" TEXT,
    "filterLogic" "FilterLogic" NOT NULL DEFAULT 'AND',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Filter" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "type" "FilterType" NOT NULL,
    "mode" "FilterMode" NOT NULL DEFAULT 'IS',
    "values" JSONB NOT NULL,

    CONSTRAINT "Filter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countries" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Click" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "flowId" TEXT,
    "ip" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "language" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "os" TEXT,
    "browser" TEXT,
    "referrer" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "isUnique" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Click_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_alias_key" ON "Campaign"("alias");

-- CreateIndex
CREATE INDEX "Campaign_alias_idx" ON "Campaign"("alias");

-- CreateIndex
CREATE INDEX "Campaign_isActive_idx" ON "Campaign"("isActive");

-- CreateIndex
CREATE INDEX "Flow_campaignId_position_idx" ON "Flow"("campaignId", "position");

-- CreateIndex
CREATE INDEX "Flow_campaignId_isActive_idx" ON "Flow"("campaignId", "isActive");

-- CreateIndex
CREATE INDEX "Flow_isDefault_idx" ON "Flow"("isDefault");

-- CreateIndex
CREATE INDEX "Filter_flowId_idx" ON "Filter"("flowId");

-- CreateIndex
CREATE INDEX "Click_campaignId_createdAt_idx" ON "Click"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "Click_createdAt_idx" ON "Click"("createdAt");

-- CreateIndex
CREATE INDEX "Click_isBot_idx" ON "Click"("isBot");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CampaignGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignUser" ADD CONSTRAINT "CampaignUser_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignUser" ADD CONSTRAINT "CampaignUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flow" ADD CONSTRAINT "Flow_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Filter" ADD CONSTRAINT "Filter_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Click" ADD CONSTRAINT "Click_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
