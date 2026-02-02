-- CreateTable
CREATE TABLE "PriceRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "buy" REAL NOT NULL,
    "sell" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PriceRecord_symbol_idx" ON "PriceRecord"("symbol");

-- CreateIndex
CREATE INDEX "PriceRecord_createdAt_idx" ON "PriceRecord"("createdAt");
