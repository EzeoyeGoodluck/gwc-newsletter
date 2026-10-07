-- AlterTable
ALTER TABLE `Delivery` ADD COLUMN `processingAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `EmailProvider` ADD COLUMN `lastCampaignBatchAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `CampaignQueueLock` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
