DROP PROCEDURE IF EXISTS `grant__api__dev_local`;
DELIMITER $$
CREATE
    DEFINER = `root`@`localhost` PROCEDURE `grant__api__dev_local`()
    MODIFIES SQL DATA
BEGIN
    GRANT EXECUTE ON PROCEDURE `health_check` TO `root`@`localhost`;
END
DELIMITER ;