/*
  Warnings:

  - A unique constraint covering the columns `[name,warehouseId]` on the table `Ingredient` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `warehouseId` to the `Ingredient` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Ingredient_name_restaurantId_key";

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "restaurantId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_name_restaurantId_key" ON "Warehouse"("name", "restaurantId");

-- Criar warehouse padrão para cada restaurante que tem ingredientes
INSERT INTO "Warehouse" ("name", "description", "restaurantId", "updated_at")
SELECT 
    'Estoque Principal',
    'Estoque padrão criado automaticamente na migração',
    "restaurantId",
    CURRENT_TIMESTAMP
FROM "Ingredient"
GROUP BY "restaurantId";

-- AlterTable - Adicionar coluna warehouseId como opcional primeiro
ALTER TABLE "Ingredient" ADD COLUMN "warehouseId" INTEGER;

-- Atualizar ingredientes existentes com o warehouse padrão de seu restaurante
UPDATE "Ingredient" i
SET "warehouseId" = w.id
FROM "Warehouse" w
WHERE w."restaurantId" = i."restaurantId" AND w."name" = 'Estoque Principal';

-- Tornar warehouseId obrigatório
ALTER TABLE "Ingredient" ALTER COLUMN "warehouseId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_warehouseId_key" ON "Ingredient"("name", "warehouseId");

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
