-- AlterTable
ALTER TABLE `churchsettings` ADD COLUMN `addressLine1` VARCHAR(191) NULL,
    ADD COLUMN `addressLine2` VARCHAR(191) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `language` VARCHAR(191) NOT NULL DEFAULT 'en-US',
    ADD COLUMN `postalCode` VARCHAR(191) NULL,
    ADD COLUMN `stateProvince` VARCHAR(191) NULL;
