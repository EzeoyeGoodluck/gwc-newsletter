/*
  Warnings:

  - You are about to drop the column `firstName` on the `member` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `member` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[memberNumber]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `memberNumber` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Member` DROP COLUMN `firstName`,
    DROP COLUMN `lastName`,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `dateOfBirth` DATETIME(3) NULL,
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `joinDate` DATETIME(3) NULL,
    ADD COLUMN `memberNumber` INTEGER NOT NULL,
    ADD COLUMN `membershipStatus` VARCHAR(191) NOT NULL DEFAULT 'active',
    ADD COLUMN `membershipType` VARCHAR(191) NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `postalCode` VARCHAR(191) NULL,
    ADD COLUMN `renewalDate` DATETIME(3) NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `streetAddress` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Member_memberNumber_key` ON `Member`(`memberNumber`);

-- CreateIndex
CREATE INDEX `Member_membershipStatus_idx` ON `Member`(`membershipStatus`);
