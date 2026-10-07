ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'CUSTOMER';

UPDATE "User"
SET "role" = CASE
    WHEN EXISTS (
        SELECT 1 FROM "Organization"
        WHERE "Organization"."id" = "User"."organizationId"
          AND "Organization"."type" = 'ADMIN'
    ) THEN 'ADMIN'
    WHEN EXISTS (
        SELECT 1 FROM "Organization"
        WHERE "Organization"."id" = "User"."organizationId"
          AND "Organization"."type" = 'AGGREGATOR'
    ) THEN 'AGGREGATOR'
    WHEN EXISTS (
        SELECT 1 FROM "Organization"
        WHERE "Organization"."id" = "User"."organizationId"
          AND "Organization"."type" = 'RESELLER'
    ) THEN 'RESELLER'
    ELSE 'CUSTOMER'
END;
