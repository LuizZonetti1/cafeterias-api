/*
  Warnings:

  - The values [WAITER,KITCHEN] on the enum `TipoUser` will be removed. If these variants are still used in the database, this will fail.
  - The values [VENCIMENTO,DETERIORACAO,DESPERDICIO] on the enum `WasteReason` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `ingredientId` on the `Stock_Movement` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `Stock_Movement` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Stock_Movement` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_user` on the `User` table. All the data in the column will be lost.
  - Added the required column `stockId` to the `Stock_Movement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type_user` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Rename column first
ALTER TABLE "User" RENAME COLUMN "tipo_user" TO "type_user";

-- AlterEnum
BEGIN;
CREATE TYPE "TipoUser_new" AS ENUM ('ADMIN', 'DEVELOPER', 'GARCOM', 'COZINHA');
ALTER TABLE "User" ALTER COLUMN "type_user" TYPE "TipoUser_new" USING ("type_user"::text::"TipoUser_new");
ALTER TYPE "TipoUser" RENAME TO "TipoUser_old";
ALTER TYPE "TipoUser_new" RENAME TO "TipoUser";
DROP TYPE "public"."TipoUser_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WasteReason_new" AS ENUM ('VENCIDO', 'DETERIORADO', 'CONTAMINADO', 'QUEBRA', 'DESPERDICIO_PREPARO', 'OUTROS');
ALTER TABLE "Stock_Movement" ALTER COLUMN "waste_reason" TYPE "WasteReason_new" USING ("waste_reason"::text::"WasteReason_new");
ALTER TYPE "WasteReason" RENAME TO "WasteReason_old";
ALTER TYPE "WasteReason_new" RENAME TO "WasteReason";
DROP TYPE "public"."WasteReason_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Item_Order" DROP CONSTRAINT "Item_Order_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Stock_Movement" DROP CONSTRAINT "Stock_Movement_ingredientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Stock_Movement" DROP CONSTRAINT "Stock_Movement_userId_fkey";

-- DropIndex
DROP INDEX "public"."Orders_userId_key";

-- AlterTable
ALTER TABLE "Item_Order" ADD COLUMN     "observations" TEXT,
ALTER COLUMN "additional" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status_order" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Stock_Movement" DROP COLUMN "ingredientId",
DROP COLUMN "reason",
DROP COLUMN "userId",
ADD COLUMN     "observation" TEXT,
ADD COLUMN     "responsible_user_id" INTEGER,
ADD COLUMN     "stockId" INTEGER NOT NULL;

-- Column already renamed above, no need to drop and add

-- CreateTable
CREATE TABLE "Item_Order_Additional" (
    "id" SERIAL NOT NULL,
    "itemOrderId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "Unit" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Item_Order_Additional_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Item_Order" ADD CONSTRAINT "Item_Order_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_Order_Additional" ADD CONSTRAINT "Item_Order_Additional_itemOrderId_fkey" FOREIGN KEY ("itemOrderId") REFERENCES "Item_Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item_Order_Additional" ADD CONSTRAINT "Item_Order_Additional_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock_Movement" ADD CONSTRAINT "Stock_Movement_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
