-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('CAR', 'TRUCK', 'VAN', 'MOTORCYCLE', 'MACHINERY');

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "category" "VehicleCategory" NOT NULL DEFAULT 'CAR';
