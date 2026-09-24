-- Add sender ID and tracking fields to Campaign table
ALTER TABLE "Campaign" 
ADD COLUMN "senderId" TEXT,
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "enableTracking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "enableWebhooks" BOOLEAN NOT NULL DEFAULT false;

-- Add comment for senderId field
COMMENT ON COLUMN "Campaign"."senderId" IS 'Custom sender ID or virtual number (e.g., "BRAND" or "+1234567890")';
