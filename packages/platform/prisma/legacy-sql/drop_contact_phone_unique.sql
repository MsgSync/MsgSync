DROP INDEX IF EXISTS "Contact_phone_key";
CREATE INDEX IF NOT EXISTS "Contact_phone_idx" ON "Contact"("phone");
