-- DropForeignKey
ALTER TABLE "public"."Item_Product" DROP CONSTRAINT "Item_Product_productId_fkey";

-- AddForeignKey
ALTER TABLE "Item_Product" ADD CONSTRAINT "Item_Product_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
