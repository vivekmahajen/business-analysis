-- Add idempotency + balance tracking to credit_transactions
ALTER TABLE "credit_transactions" ADD COLUMN IF NOT EXISTS "idempotency_key" VARCHAR(100);
ALTER TABLE "credit_transactions" ADD COLUMN IF NOT EXISTS "balance_after" INTEGER;

-- Unique partial index (NULL values are excluded from uniqueness checks in PostgreSQL)
CREATE UNIQUE INDEX IF NOT EXISTS "credit_transactions_idempotency_key_key"
  ON "credit_transactions"("idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;

-- Add audience mode, published snapshot, and cost tracking to reports
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "audience_mode" VARCHAR(20) NOT NULL DEFAULT 'consumer';
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "published_data" JSONB;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "cost_tokens" INTEGER NOT NULL DEFAULT 1;
