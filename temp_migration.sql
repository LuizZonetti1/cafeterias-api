-- Migrar dados de TipoUser
UPDATE "User" SET type_user = 'GARCOM' WHERE type_user = 'WAITER';
UPDATE "User" SET type_user = 'COZINHA' WHERE type_user = 'KITCHEN';

-- Migrar dados de WasteReason
UPDATE "Stock_Movement" SET waste_reason = 'VENCIDO' WHERE waste_reason = 'VENCIMENTO';
UPDATE "Stock_Movement" SET waste_reason = 'DETERIORADO' WHERE waste_reason = 'DETERIORACAO';
UPDATE "Stock_Movement" SET waste_reason = 'DESPERDICIO_PREPARO' WHERE waste_reason = 'DESPERDICIO';

-- Preparar Stock_Movement
ALTER TABLE "Stock_Movement" ADD COLUMN IF NOT EXISTS "stockId_temp" INTEGER;
ALTER TABLE "Stock_Movement" ADD COLUMN IF NOT EXISTS "observation" TEXT;
ALTER TABLE "Stock_Movement" ADD COLUMN IF NOT EXISTS "responsible_user_id" INTEGER;

-- Popular stockId
UPDATE "Stock_Movement" sm
SET "stockId_temp" = s.id
FROM "Stock" s
WHERE s."ingredientId" = sm."ingredientId";

-- Migrar dados
UPDATE "Stock_Movement" SET "observation" = reason WHERE reason IS NOT NULL AND observation IS NULL;
UPDATE "Stock_Movement" SET "responsible_user_id" = "userId" WHERE "userId" IS NOT NULL AND responsible_user_id IS NULL;

-- Remover constraints antigas
ALTER TABLE "Item_Order" DROP CONSTRAINT IF EXISTS "Item_Order_orderId_fkey";
ALTER TABLE "Stock_Movement" DROP CONSTRAINT IF EXISTS "Stock_Movement_ingredientId_fkey";
ALTER TABLE "Stock_Movement" DROP CONSTRAINT IF EXISTS "Stock_Movement_userId_fkey";

-- Remover index único
DROP INDEX IF EXISTS "Orders_userId_key";

-- Modificar Item_Order
ALTER TABLE "Item_Order" ADD COLUMN IF NOT EXISTS "observations" TEXT;
ALTER TABLE "Item_Order" ALTER COLUMN "additional" DROP NOT NULL;

-- Modificar Orders
ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
UPDATE "Orders" SET "created_at" = CURRENT_TIMESTAMP WHERE "created_at" IS NULL;
UPDATE "Orders" SET "updated_at" = CURRENT_TIMESTAMP WHERE "updated_at" IS NULL;
ALTER TABLE "Orders" ALTER COLUMN "created_at" SET NOT NULL;
ALTER TABLE "Orders" ALTER COLUMN "updated_at" SET NOT NULL;
ALTER TABLE "Orders" ALTER COLUMN "status_order" SET DEFAULT 'PENDING';

-- Remover colunas antigas de Stock_Movement
ALTER TABLE "Stock_Movement" DROP COLUMN IF EXISTS "cost_per_unit";
ALTER TABLE "Stock_Movement" DROP COLUMN IF EXISTS "supplier";
ALTER TABLE "Stock_Movement" DROP COLUMN IF EXISTS "expiration_date";
ALTER TABLE "Stock_Movement" DROP COLUMN IF EXISTS "ingredientId";
ALTER TABLE "Stock_Movement" DROP COLUMN IF EXISTS "reason";
ALTER TABLE "Stock_Movement" DROP COLUMN IF EXISTS "userId";

-- Renomear e tornar obrigatória
ALTER TABLE "Stock_Movement" RENAME COLUMN "stockId_temp" TO "stockId";
ALTER TABLE "Stock_Movement" ALTER COLUMN "stockId" SET NOT NULL;

-- Adicionar constraints novas
ALTER TABLE "Item_Order" ADD CONSTRAINT "Item_Order_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Stock_Movement" ADD CONSTRAINT "Stock_Movement_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
