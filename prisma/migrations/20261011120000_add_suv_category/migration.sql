-- Add SUV to the vehicle category enum.
-- Postgres keeps enum values ordered by creation, so SUV is placed
-- explicitly after CAR to match the order the pickers show.
ALTER TYPE "VehicleCategory" ADD VALUE IF NOT EXISTS 'SUV' AFTER 'CAR';
