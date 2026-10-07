-- AlterTable
ALTER TABLE `User` MODIFY `role` VARCHAR(191) NOT NULL DEFAULT 'VIEWER';

-- CreateTable
CREATE TABLE `ChurchSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `name` VARCHAR(191) NOT NULL DEFAULT 'Glory Worship Church',
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `website` VARCHAR(191) NULL,
    `logoUrl` TEXT NULL,
    `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#1B2A4A',
    `accentColor` VARCHAR(191) NOT NULL DEFAULT '#F6C84C',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'UTC',
    `senderName` VARCHAR(191) NULL,
    `senderEmail` VARCHAR(191) NULL,
    `replyTo` VARCHAR(191) NULL,
    `footerText` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Member` (
    `id` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `status` ENUM('SUBSCRIBED', 'UNSUBSCRIBED', 'BOUNCED') NOT NULL DEFAULT 'SUBSCRIBED',
    `source` VARCHAR(191) NULL,
    `consentAt` DATETIME(3) NULL,
    `consentSource` VARCHAR(191) NULL,
    `unsubscribedAt` DATETIME(3) NULL,
    `unsubscribeToken` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Member_email_key`(`email`),
    UNIQUE INDEX `Member_unsubscribeToken_key`(`unsubscribeToken`),
    INDEX `Member_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Group` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `color` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Group_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MemberGroup` (
    `memberId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MemberGroup_groupId_idx`(`groupId`),
    PRIMARY KEY (`memberId`, `groupId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Template` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `design` JSON NULL,
    `html` LONGTEXT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Newsletter` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `previewText` VARCHAR(191) NULL,
    `content` JSON NULL,
    `html` LONGTEXT NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'DRAFT',
    `category` VARCHAR(191) NULL,
    `sendToAll` BOOLEAN NOT NULL DEFAULT true,
    `scheduledAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `recipientCount` INTEGER NOT NULL DEFAULT 0,
    `sentCount` INTEGER NOT NULL DEFAULT 0,
    `failedCount` INTEGER NOT NULL DEFAULT 0,
    `openCount` INTEGER NOT NULL DEFAULT 0,
    `clickCount` INTEGER NOT NULL DEFAULT 0,
    `templateId` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Newsletter_status_idx`(`status`),
    INDEX `Newsletter_scheduledAt_idx`(`scheduledAt`),
    INDEX `Newsletter_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsletterGroup` (
    `newsletterId` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`newsletterId`, `groupId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Delivery` (
    `id` VARCHAR(191) NOT NULL,
    `newsletterId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `status` ENUM('QUEUED', 'SENT', 'FAILED', 'BOUNCED') NOT NULL DEFAULT 'QUEUED',
    `error` TEXT NULL,
    `trackingId` VARCHAR(191) NOT NULL,
    `sentAt` DATETIME(3) NULL,
    `openedAt` DATETIME(3) NULL,
    `clickedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Delivery_trackingId_key`(`trackingId`),
    INDEX `Delivery_newsletterId_status_idx`(`newsletterId`, `status`),
    UNIQUE INDEX `Delivery_newsletterId_email_key`(`newsletterId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MemberGroup` ADD CONSTRAINT `MemberGroup_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MemberGroup` ADD CONSTRAINT `MemberGroup_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Template` ADD CONSTRAINT `Template_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Newsletter` ADD CONSTRAINT `Newsletter_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `Template`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Newsletter` ADD CONSTRAINT `Newsletter_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NewsletterGroup` ADD CONSTRAINT `NewsletterGroup_newsletterId_fkey` FOREIGN KEY (`newsletterId`) REFERENCES `Newsletter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NewsletterGroup` ADD CONSTRAINT `NewsletterGroup_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Delivery` ADD CONSTRAINT `Delivery_newsletterId_fkey` FOREIGN KEY (`newsletterId`) REFERENCES `Newsletter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Delivery` ADD CONSTRAINT `Delivery_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
