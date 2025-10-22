/*
  Warnings:

  - A unique constraint covering the columns `[name,restaurantId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `restaurantId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restaurantId` to the `Ingredient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restaurantId` to the `Orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `restaurantId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "TipoUser" ADD VALUE 'DEVELOPER';

-- DropIndex
DROP INDEX "public"."Category_name_key";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "restaurantId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "quantity_minimum" DOUBLE PRECISION NOT NULL DEFAULT 10,
ADD COLUMN     "restaurantId" INTEGER NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'kg';

-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "restaurantId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "restaurantId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "restaurantId" INTEGER;

-- CreateTable
CREATE TABLE "restaurants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "logo_url" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_restaurantId_key" ON "Category"("name", "restaurantId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
