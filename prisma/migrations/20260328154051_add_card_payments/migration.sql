-- CreateTable
CREATE TABLE "CardPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "billing" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'active',
    "subscriptionId" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardPayment_userId_idx" ON "CardPayment"("userId");

-- CreateIndex
CREATE INDEX "CardPayment_status_idx" ON "CardPayment"("status");

-- CreateIndex
CREATE INDEX "CardPayment_createdAt_idx" ON "CardPayment"("createdAt");

-- AddForeignKey
ALTER TABLE "CardPayment" ADD CONSTRAINT "CardPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
