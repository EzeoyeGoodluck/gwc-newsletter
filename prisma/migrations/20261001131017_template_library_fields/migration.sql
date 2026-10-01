-- AlterTable
ALTER TABLE `template` ADD COLUMN `category` VARCHAR(191) NOT NULL DEFAULT 'General',
    ADD COLUMN `isPopular` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `thumbnailUrl` VARCHAR(1000) NULL;
