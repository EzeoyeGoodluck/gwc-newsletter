-- CreateTable
CREATE TABLE `EmailProvider` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `preset` VARCHAR(191) NOT NULL DEFAULT 'custom',
    `host` VARCHAR(191) NOT NULL,
    `port` INTEGER NOT NULL DEFAULT 587,
    `secure` BOOLEAN NOT NULL DEFAULT false,
    `username` VARCHAR(191) NOT NULL,
    `passwordEnc` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `maxPerHour` INTEGER NULL,
    `maxPerDay` INTEGER NULL,
    `batchSize` INTEGER NOT NULL DEFAULT 50,
    `batchDelaySec` INTEGER NOT NULL DEFAULT 60,
    `lastTestedAt` DATETIME(3) NULL,
    `lastTestOk` BOOLEAN NULL,
    `lastError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmailProvider_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
