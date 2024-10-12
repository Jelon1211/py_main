SET NAMES utf8

DROP TABLE IF EXISTS `articles`;
CREATE TABLE `articles` (
    `id` INT(10)   UNSIGNED                             NOT NULL AUTO_INCREMENT,
    `title`        VARCHAR(255)                         NOT NULL,
    `author`       VARCHAR(255),
    `content`      TEXT                                 NOT NULL,
    `images`       JSON,
    `source_url`   VARCHAR(255)                         NOT NULL,
    `categories`   VARCHAR(255),
    `uuid`         CHAR(36) COLLATE `utf8_unicode_ci`   NOT NULL,
    `created`      INT(10)                              UNSIGNED NOT NULL,
    `modified`     INT(10)                              UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uuid` (`uuid`)
);

DROP PROCEDURE IF EXISTS `health_check`;
DELIMITER $$

CREATE PROCEDURE `health_check`()
BEGIN
    SELECT 1;
    END $$
    DELIMITER ;