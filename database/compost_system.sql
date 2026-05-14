-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: May 14, 2026 at 07:07 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `compost_system`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_login_user` (IN `p_email` VARCHAR(150), IN `p_password` VARCHAR(255))   BEGIN
    DECLARE v_username VARCHAR(50);

    SET v_username = LOWER(TRIM(p_email));

    SELECT
        user_id,
        full_name AS name,
        username AS email,
        role
    FROM users
    WHERE username = v_username
      AND password_hash = SHA2(CONCAT(password_salt, p_password), 256)
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_register_user` (IN `p_name` VARCHAR(100), IN `p_email` VARCHAR(150), IN `p_password` VARCHAR(255))   BEGIN
    DECLARE v_username VARCHAR(50);
    DECLARE v_salt VARCHAR(64);
    DECLARE v_password_hash VARCHAR(255);

    SET v_username = LOWER(TRIM(p_email));

    IF TRIM(p_name) = '' OR v_username = '' OR TRIM(p_password) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'All fields are required.';
    END IF;

    IF CHAR_LENGTH(p_password) < 8 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Password must be at least 8 characters long.';
    END IF;

    IF EXISTS (SELECT 1 FROM users WHERE username = v_username) THEN
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
        TRIM(p_name),
        v_username,
        v_password_hash,
        v_salt,
        'OPERATOR'
    );

    SELECT
        user_id,
        full_name AS name,
        username AS email,
        role
    FROM users
    WHERE user_id = LAST_INSERT_ID();
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `actuator_logs`
--

CREATE TABLE `actuator_logs` (
  `log_id` int(11) NOT NULL,
  `batch_id` int(11) DEFAULT NULL,
  `actuator_type` enum('FAN','WATER_SPRAY') NOT NULL,
  `status` enum('ON','OFF') NOT NULL,
  `trigger_source` enum('AUTO','MANUAL','SAFETY') NOT NULL DEFAULT 'AUTO',
  `related_reading_id` int(11) DEFAULT NULL,
  `triggered_by_user_id` int(11) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ai_predictions`
--

CREATE TABLE `ai_predictions` (
  `prediction_id` int(11) NOT NULL,
  `batch_id` int(11) DEFAULT NULL,
  `prediction_type` enum('READINESS_ESTIMATE','CONDITION_ANALYSIS','SAFETY_ALERT') NOT NULL DEFAULT 'READINESS_ESTIMATE',
  `reading_id` int(11) NOT NULL,
  `predicted_condition` enum('OPTIMAL','TOO_DRY','TOO_WET','HIGH_GAS_LEVEL','HIGH_TEMPERATURE','LOW_TEMPERATURE','HIGH_HUMIDITY','LOW_HUMIDITY','NEEDS_ATTENTION') NOT NULL,
  `prediction_summary` text NOT NULL,
  `estimated_ready_date` date DEFAULT NULL,
  `estimated_days_remaining` int(11) DEFAULT NULL,
  `recommendation` text DEFAULT NULL,
  `trend_summary` text DEFAULT NULL,
  `analysis_window_start` datetime DEFAULT NULL,
  `analysis_window_end` datetime DEFAULT NULL,
  `confidence_score` decimal(5,2) DEFAULT NULL,
  `model_provider` varchar(50) DEFAULT 'Gemini',
  `model_name` varchar(100) DEFAULT NULL,
  `input_snapshot` longtext DEFAULT NULL,
  `raw_ai_response` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `compost_batches`
--

CREATE TABLE `compost_batches` (
  `batch_id` int(11) NOT NULL,
  `batch_code` varchar(30) NOT NULL,
  `batch_name` varchar(100) NOT NULL,
  `primary_material` varchar(100) NOT NULL,
  `material_description` text DEFAULT NULL,
  `start_date` date NOT NULL,
  `expected_duration_days` int(11) DEFAULT NULL,
  `initial_estimated_ready_date` date DEFAULT NULL,
  `latest_predicted_ready_date` date DEFAULT NULL,
  `actual_ready_date` date DEFAULT NULL,
  `status` enum('ACTIVE','READY_FOR_CHECKING','READY','COMPLETED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `bin_location` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `compost_batches`
--

INSERT INTO `compost_batches` (`batch_id`, `batch_code`, `batch_name`, `primary_material`, `material_description`, `start_date`, `expected_duration_days`, `initial_estimated_ready_date`, `latest_predicted_ready_date`, `actual_ready_date`, `status`, `bin_location`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'BATCH-001', 'Initial Compost Batch', 'Biodegradable Waste', 'Initial compost batch using biodegradable waste collected for system testing.', '2026-05-12', 30, '2026-06-11', '2026-06-19', NULL, 'ACTIVE', 'Barangay Compost Area', 'Default batch used for initial testing and AI prediction integration.', NULL, '2026-05-12 12:53:29', '2026-05-14 02:49:24');

-- --------------------------------------------------------

--
-- Table structure for table `sensor_readings`
--

CREATE TABLE `sensor_readings` (
  `reading_id` int(11) NOT NULL,
  `batch_id` int(11) DEFAULT NULL,
  `moisture_level` decimal(5,2) NOT NULL,
  `gas_level` decimal(8,2) NOT NULL,
  `temperature_c` decimal(5,2) NOT NULL,
  `temperature_status` enum('LOW','NORMAL','HIGH') DEFAULT NULL,
  `humidity_level` decimal(5,2) NOT NULL,
  `humidity_status` enum('LOW','NORMAL','HIGH') DEFAULT NULL,
  `moisture_status` enum('LOW','NORMAL','HIGH') NOT NULL,
  `gas_status` enum('LOW','NORMAL','HIGH') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sensor_readings`
--

INSERT INTO `sensor_readings` (`reading_id`, `batch_id`, `moisture_level`, `gas_level`, `temperature_c`, `temperature_status`, `humidity_level`, `humidity_status`, `moisture_status`, `gas_status`, `created_at`) VALUES
(1, NULL, 67.20, 700.00, 28.00, 'NORMAL', 54.30, 'NORMAL', 'NORMAL', 'LOW', '2026-05-14 05:06:54');

-- --------------------------------------------------------

--
-- Table structure for table `threshold_settings`
--

CREATE TABLE `threshold_settings` (
  `setting_id` int(11) NOT NULL,
  `moisture_min` decimal(5,2) NOT NULL,
  `gas_max` decimal(8,2) NOT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `threshold_settings`
--

INSERT INTO `threshold_settings` (`setting_id`, `moisture_min`, `gas_max`, `updated_by`, `updated_at`) VALUES
(1, 40.00, 40.00, 1, '2026-05-07 21:09:38'),
(2, 40.00, 40.00, NULL, '2026-05-10 07:13:47');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `password_salt` varchar(64) DEFAULT NULL,
  `role` enum('ADMIN','OPERATOR') NOT NULL DEFAULT 'OPERATOR',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `username`, `password_hash`, `password_salt`, `role`, `created_at`) VALUES
(1, 'Barangay Environmentalist', 'admin', 'temporary_password_hash', NULL, 'ADMIN', '2026-05-07 21:09:38'),
(2, 'Mike Admin', 'admin@compost.local', '5517ba9a5164f971400f58f30ffbc561ef64ce43efe771777ec03ec7244b7954', 'cbd29e38668672ee92f3c6f84d7dac3046b28d10e1d9c74d60415f7f5910b760', 'OPERATOR', '2026-05-08 08:46:14'),
(3, 'Test User', 'testuser2@compost.local', '4f058d941c08ee1ab5f9bbc494fe9e6ae0e9804dbb322542043336e9ac878946', '1435f215d5a33557adacdb4c20ce1140478dc7cfc22eb9cf74c1b3b8a2cabc3f', 'OPERATOR', '2026-05-08 09:39:37'),
(4, 'Washushe', 'washushe@gmail.com', '5f9a3695817e78b2a246f3dce0db09ab0d1576de7f0dac6a8bea9d4adefd521f', '587fe635576192aeb82cd8033617d2b9d5463abe90f9104bb8d6270a56dd0eda', 'OPERATOR', '2026-05-08 09:40:54'),
(6, 'John Marie Diogracias', 'diograciasj@gmail.com', 'ea92213883c7d97c7512ed986d36938e40d102bc1a119327549148b1229d70a2', '4380b4644073bc52f388965d8d092061904842c4ab0b47370c6ff029a4822ff4', 'OPERATOR', '2026-05-14 03:52:18');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `actuator_logs`
--
ALTER TABLE `actuator_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `related_reading_id` (`related_reading_id`),
  ADD KEY `triggered_by_user_id` (`triggered_by_user_id`),
  ADD KEY `fk_actuator_logs_batch` (`batch_id`);

--
-- Indexes for table `ai_predictions`
--
ALTER TABLE `ai_predictions`
  ADD PRIMARY KEY (`prediction_id`),
  ADD KEY `reading_id` (`reading_id`),
  ADD KEY `fk_ai_predictions_batch` (`batch_id`);

--
-- Indexes for table `compost_batches`
--
ALTER TABLE `compost_batches`
  ADD PRIMARY KEY (`batch_id`),
  ADD UNIQUE KEY `batch_code` (`batch_code`),
  ADD KEY `fk_compost_batches_created_by` (`created_by`);

--
-- Indexes for table `sensor_readings`
--
ALTER TABLE `sensor_readings`
  ADD PRIMARY KEY (`reading_id`),
  ADD KEY `fk_sensor_readings_batch` (`batch_id`);

--
-- Indexes for table `threshold_settings`
--
ALTER TABLE `threshold_settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `actuator_logs`
--
ALTER TABLE `actuator_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ai_predictions`
--
ALTER TABLE `ai_predictions`
  MODIFY `prediction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `compost_batches`
--
ALTER TABLE `compost_batches`
  MODIFY `batch_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `sensor_readings`
--
ALTER TABLE `sensor_readings`
  MODIFY `reading_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `threshold_settings`
--
ALTER TABLE `threshold_settings`
  MODIFY `setting_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `actuator_logs`
--
ALTER TABLE `actuator_logs`
  ADD CONSTRAINT `actuator_logs_ibfk_1` FOREIGN KEY (`related_reading_id`) REFERENCES `sensor_readings` (`reading_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `actuator_logs_ibfk_2` FOREIGN KEY (`triggered_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_actuator_logs_batch` FOREIGN KEY (`batch_id`) REFERENCES `compost_batches` (`batch_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `ai_predictions`
--
ALTER TABLE `ai_predictions`
  ADD CONSTRAINT `ai_predictions_ibfk_1` FOREIGN KEY (`reading_id`) REFERENCES `sensor_readings` (`reading_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ai_predictions_batch` FOREIGN KEY (`batch_id`) REFERENCES `compost_batches` (`batch_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `compost_batches`
--
ALTER TABLE `compost_batches`
  ADD CONSTRAINT `fk_compost_batches_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `sensor_readings`
--
ALTER TABLE `sensor_readings`
  ADD CONSTRAINT `fk_sensor_readings_batch` FOREIGN KEY (`batch_id`) REFERENCES `compost_batches` (`batch_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `threshold_settings`
--
ALTER TABLE `threshold_settings`
  ADD CONSTRAINT `threshold_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
