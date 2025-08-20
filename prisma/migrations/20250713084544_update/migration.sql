/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.
  - Made the column `currency` on table `plans` required. This step will fail if there are existing NULL values in that column.
  - Made the column `interval` on table `plans` required. This step will fail if there are existing NULL values in that column.
  - Made the column `intervalCount` on table `plans` required. This step will fail if there are existing NULL values in that column.
  - Made the column `active` on table `plans` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Interval" ADD VALUE 'day';
ALTER TYPE "Interval" ADD VALUE 'week';
ALTER TYPE "Interval" ADD VALUE 'year';

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "freeTrialDays" INTEGER,
ALTER COLUMN "currency" SET NOT NULL,
ALTER COLUMN "currency" DROP DEFAULT,
ALTER COLUMN "interval" SET NOT NULL,
ALTER COLUMN "interval" SET DEFAULT 'month',
ALTER COLUMN "intervalCount" SET NOT NULL,
ALTER COLUMN "active" SET NOT NULL,
ALTER COLUMN "active" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");
