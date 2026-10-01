-- AlterTable
ALTER TABLE `churchsettings` ADD COLUMN `alertOnFailure` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `alertOnSuccess` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `alertRecipients` TEXT NULL,
    ADD COLUMN `defaultTestSend` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `unsubscribeText` TEXT NULL;
