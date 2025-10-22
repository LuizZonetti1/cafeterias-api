/*
  Warnings:

  - You are about to drop the column `quantity_general` on the `Ingredient` table. All the data in the column will be lost.
  - You are about to drop the column `quantity_minimum` on the `Ingredient` table. All the data in the column will be lost.
  - The `unit` column on the `Ingredient` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `wasteId` on the `Stock_Movement` table. All the data in the column will be lost.
  - You are about to drop the `Waste` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,restaurantId]` on the table `Ingredient` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,ingredientId]` on the table `Item_Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ingredientId]` on the table `Stock` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `quantity` to the `Item_Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `Item_Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `Item_Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_updated_by` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ingredientId` to the `Stock_Movement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Stock_Movement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Stock_Movement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('GRAMAS', 'LITROS', 'UNIDADES', 'MILILITROS');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('ENTRADA', 'SAIDA_RECEITA', 'SAIDA_PERDA');

-- CreateEnum
CREATE TYPE "WasteReason" AS ENUM ('VENCIMENTO', 'DETERIORACAO', 'DESPERDICIO', 'OUTROS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LOW_STOCK', 'OUT_OF_STOCK');

-- DropForeignKey
ALTER TABLE "public"."Stock_Movement" DROP CONSTRAINT "Stock_Movement_wasteId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Waste" DROP CONSTRAINT "Waste_ingredientId_fkey";

-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "quantity_general",
DROP COLUMN "quantity_minimum",
DROP COLUMN "unit",
ADD COLUMN     "unit" "Unit" NOT NULL DEFAULT 'GRAMAS';

-- AlterTable
ALTER TABLE "Item_Product" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "unit" "Unit" NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Stock" ADD COLUMN     "last_updated_by" INTEGER NOT NULL,
ADD COLUMN     "quantity_minimum" DOUBLE PRECISION NOT NULL DEFAULT 50,
ALTER COLUMN "quantity_current" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Stock_Movement" DROP COLUMN "wasteId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ingredientId" INTEGER NOT NULL,
ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "type" "MovementType" NOT NULL,
ADD COLUMN     "waste_reason" "WasteReason";

-- DropTable
DROP TABLE "public"."Waste";

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'LOW_STOCK',
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "restaurantId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_restaurantId_key" ON "Ingredient"("name", "restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_Product_productId_ingredientId_key" ON "Item_Product"("productId", "ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_ingredientId_key" ON "Stock"("ingredientId");

-- AddForeignKey
ALTER TABLE "Stock_Movement" ADD CONSTRAINT "Stock_Movement_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
