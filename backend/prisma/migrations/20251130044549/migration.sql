-- CreateTable
CREATE TABLE "MovementLock" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovementLock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MovementLock_batchId_key" ON "MovementLock"("batchId");
