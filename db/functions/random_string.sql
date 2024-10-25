DROP FUNCTION IF EXISTS random_string;
DELIMITER $$
CREATE
	DEFINER = `root`@`localhost` FUNCTION random_string(
	_size SMALLINT(3),
	_options JSON)
	RETURNS CHAR(64) CHARSET utf8 COLLATE utf8_unicode_ci
	READS SQL DATA
BEGIN
	SET @__result = '';
	SET @__allowed_chars = '';
	SET @__iterator = 0;

	IF JSON_EXTRACT(_options, '$.lower') IS NULL
			OR (JSON_UNQUOTE(JSON_EXTRACT(_options, '$.lower')) IN ('null', 'true', 1, '1'))
	THEN
		SET @__allowed_chars = CONCAT(@__allowed_chars, 'abcdefghijklmnopqrstuvwxyz');
	END IF;
	IF JSON_EXTRACT(_options, '$.upper') IS NULL
			OR (JSON_UNQUOTE(JSON_EXTRACT(_options, '$.upper')) IN ('null', 'true', 1, '1'))
	THEN
		SET @__allowed_chars = CONCAT(@__allowed_chars, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
	END IF;
	IF JSON_EXTRACT(_options, '$.digits') IS NULL
			OR (JSON_UNQUOTE(JSON_EXTRACT(_options, '$.digits')) IN ('null', 'true', 1, '1'))
	THEN
		SET @__allowed_chars = CONCAT(@__allowed_chars, '1234567890');
	END IF;
	IF JSON_EXTRACT(_options, '$.underscore') IS NULL
			OR (JSON_UNQUOTE(JSON_EXTRACT(_options, '$.underscore')) IN ('null', 'true', 1, '1'))
	THEN
		SET @__allowed_chars = CONCAT(@__allowed_chars, '_');
	END IF;

	IF @__allowed_chars = ''
	THEN
		SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No available chars', MYSQL_ERRNO = 1000;
	END IF;

	WHILE (@__iterator < _size)
		DO
			SET @__result = CONCAT(
					@__result,
					SUBSTRING(
							@__allowed_chars,
							FLOOR(RAND() * LENGTH(@__allowed_chars) + 1),
							1
						)
				);
			SET @__iterator = @__iterator + 1;
		END WHILE;
	RETURN @__result;
END $$
DELIMITER ;