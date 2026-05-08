USE compost_system;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_salt VARCHAR(64) NULL AFTER password_hash;

ALTER TABLE users
MODIFY COLUMN role ENUM('ADMIN', 'OPERATOR') NOT NULL DEFAULT 'OPERATOR';

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_register_user$$

CREATE PROCEDURE sp_register_user(
    IN p_full_name VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255)
)
BEGIN
    DECLARE v_salt VARCHAR(64);
    DECLARE v_password_hash VARCHAR(64);
    DECLARE v_email VARCHAR(100);

    SET v_email = LOWER(TRIM(p_email));

    IF TRIM(p_full_name) = '' OR v_email = '' OR TRIM(p_password) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'All fields are required.';
    END IF;

    IF CHAR_LENGTH(p_password) < 8 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Password must be at least 8 characters long.';
    END IF;

    IF EXISTS (SELECT 1 FROM users WHERE username = v_email) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Email is already registered.';
    END IF;

    SET v_salt = SHA2(CONCAT(UUID(), RAND(), NOW(6)), 256);
    SET v_password_hash = SHA2(CONCAT(v_salt, p_password), 256);

    INSERT INTO users (
        full_name,
        username,
        password_hash,
        password_salt,
        role
    )
    VALUES (
        TRIM(p_full_name),
        v_email,
        v_password_hash,
        v_salt,
        'OPERATOR'
    );

    SELECT 
        user_id,
        full_name,
        username AS email,
        role
    FROM users
    WHERE user_id = LAST_INSERT_ID();
END$$

DROP PROCEDURE IF EXISTS sp_login_user$$

CREATE PROCEDURE sp_login_user(
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255)
)
BEGIN
    SELECT 
        user_id,
        full_name,
        username AS email,
        role
    FROM users
    WHERE username = LOWER(TRIM(p_email))
      AND password_hash = SHA2(CONCAT(password_salt, p_password), 256)
    LIMIT 1;
END$$

DELIMITER ;