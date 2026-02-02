-- AlterTable
ALTER TABLE "PriceRecord" ADD COLUMN "change" REAL;
ALTER TABLE "PriceRecord" ADD COLUMN "direction" TEXT;
ALTER TABLE "PriceRecord" ADD COLUMN "ratio" REAL;
