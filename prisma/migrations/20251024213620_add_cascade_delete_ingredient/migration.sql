-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_ingredientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Stock" DROP CONSTRAINT "Stock_ingredientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Stock_Movement" DROP CONSTRAINT "Stock_Movement_ingredientId_fkey";

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock_Movement" ADD CONSTRAINT "Stock_Movement_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
