-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "contentTypeId" INTEGER NOT NULL,
    "addr1" TEXT,
    "mapx" REAL,
    "mapy" REAL,
    "firstImage" TEXT,
    "modifiedTime" TEXT,
    "rawAcmpyTypeCd" TEXT,
    "rawAcmpyPsblCpam" TEXT,
    "rawAcmpyNeedMtr" TEXT,
    "rawEtcAcmpyInfo" TEXT,
    "rawRelaPosesFclty" TEXT,
    "rawRelaFrnshPrdlst" TEXT,
    "rawRelaPurcPrdlst" TEXT,
    "rawRelaRntlPrdlst" TEXT,
    "rawRelaAcdntRiskMtr" TEXT,
    "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PetPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facilityId" TEXT NOT NULL,
    "indoorAllowed" TEXT NOT NULL,
    "outdoorAllowed" TEXT NOT NULL,
    "breedRestriction" TEXT NOT NULL,
    "muzzleRequired" BOOLEAN NOT NULL,
    "leashRequired" BOOLEAN NOT NULL,
    "needsManualCheck" BOOLEAN NOT NULL,
    "exceptionsJson" TEXT,
    "generalNotesJson" TEXT,
    "parsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PetPolicy_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facilityId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "visitedOn" DATETIME NOT NULL,
    "stillAccurate" BOOLEAN NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PetPolicy_facilityId_key" ON "PetPolicy"("facilityId");
