-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 14, 2026 at 08:03 AM
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_latest_sensor_reading` () BEGIN
    DECLARE v_batch_id INT DEFAULT NULL;

    SET v_batch_id = (
        SELECT batch_id
        FROM compost_batches
        WHERE status = 'ACTIVE'
        ORDER BY start_date DESC, batch_id DESC
        LIMIT 1
    );

    IF v_batch_id IS NULL THEN
        SELECT
            reading_id,
            batch_id,
            moisture_level,
            gas_level,
            temperature_c,
            humidity_level,
            moisture_status,
            gas_status,
            temperature_status,
            humidity_status,
            created_at
        FROM sensor_readings
        ORDER BY created_at DESC, reading_id DESC
        LIMIT 1;
    ELSE
        SELECT
            reading_id,
            batch_id,
            moisture_level,
            gas_level,
            temperature_c,
            humidity_level,
            moisture_status,
            gas_status,
            temperature_status,
            humidity_status,
            created_at
        FROM sensor_readings
        WHERE batch_id = v_batch_id
        ORDER BY created_at DESC, reading_id DESC
        LIMIT 1;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_insert_actuator_log` (
    IN `p_batch_id` INT,
    IN `p_actuator_type` VARCHAR(20),
    IN `p_status` VARCHAR(10),
    IN `p_trigger_source` VARCHAR(20),
    IN `p_related_reading_id` INT,
    IN `p_triggered_by_user_id` INT,
    IN `p_reason` VARCHAR(255)
) BEGIN
    INSERT INTO actuator_logs (
        batch_id,
        actuator_type,
        status,
        trigger_source,
        related_reading_id,
        triggered_by_user_id,
        reason
    )
    VALUES (
        p_batch_id,
        p_actuator_type,
        p_status,
        p_trigger_source,
        p_related_reading_id,
        p_triggered_by_user_id,
        p_reason
    );
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

--
-- Dumping data for table `ai_predictions`
--

INSERT INTO `ai_predictions` (`prediction_id`, `batch_id`, `prediction_type`, `reading_id`, `predicted_condition`, `prediction_summary`, `estimated_ready_date`, `estimated_days_remaining`, `recommendation`, `trend_summary`, `analysis_window_start`, `analysis_window_end`, `confidence_score`, `model_provider`, `model_name`, `input_snapshot`, `raw_ai_response`, `created_at`) VALUES
(1, 1, 'READINESS_ESTIMATE', 125, 'HIGH_GAS_LEVEL', 'The compost batch, which started less than a day ago, is experiencing consistently high gas levels according to the system\'s set threshold (gas_max: 40.00). Moisture, temperature, and humidity are currently within optimal ranges. The high gas levels, if sustained without proper aeration, could lead to anaerobic conditions and significantly delay the composting process. There\'s an inconsistency where the latest reading\'s gas status is \'NORMAL\' despite the value being 700.00, which is far above the 40.00 threshold, suggesting a potential misconfiguration or discrepancy in threshold application.', NULL, NULL, 'Immediately investigate the \'gas_max\' threshold setting (currently 40.00) as it appears to be extremely low compared to actual readings (average 860.05). If the threshold is correct, verify fan actuator functionality and its triggering logic, as no fan activity has been logged despite consistently high gas levels. Consider manual aeration to reduce current gas levels and prevent anaerobic conditions. Monitor gas levels closely after any adjustments.', 'Moisture levels have been consistently optimal, well above the minimum threshold. Gas levels have been overwhelmingly high, exceeding the set \'gas_max\' threshold for almost all recorded readings (123 out of 125). Despite this, no fan actuator activity has been logged. Temperature and humidity have remained stable and within acceptable ranges for composting.', '2026-05-10 15:09:57', '2026-05-12 18:01:53', 0.30, 'Gemini', 'gemini-2.5-flash', '{\"readingSummary\":{\"total_readings\":125,\"analysis_window_start\":1778396997000,\"analysis_window_end\":1778580113000,\"avg_moisture\":66.445600,\"min_moisture\":59.40,\"max_moisture\":69.60,\"low_moisture_count\":0,\"high_moisture_count\":0,\"avg_gas\":860.058400,\"min_gas\":700.00,\"max_gas\":1201.00,\"high_gas_count\":123,\"avg_temperature\":29.832800,\"min_temperature\":27.60,\"max_temperature\":33.40,\"low_temperature_count\":0,\"high_temperature_count\":0,\"avg_humidity\":56.336800,\"min_humidity\":54.10,\"max_humidity\":59.90,\"low_humidity_count\":0,\"high_humidity_count\":0},\"batch\":{\"batch_id\":1,\"batch_code\":\"BATCH-001\",\"batch_name\":\"Initial Compost Batch\",\"primary_material\":\"Biodegradable Waste\",\"material_description\":\"Initial compost batch using biodegradable waste collected for system testing.\",\"start_date\":1778515200000,\"expected_duration_days\":30,\"initial_estimated_ready_date\":1781107200000,\"latest_predicted_ready_date\":null,\"actual_ready_date\":null,\"status\":\"ACTIVE\",\"bin_location\":\"Barangay Compost Area\",\"notes\":\"Default batch used for initial testing and AI prediction integration.\"},\"latestReading\":{\"reading_id\":125,\"batch_id\":1,\"moisture_level\":59.40,\"gas_level\":700.00,\"temperature_c\":29.70,\"temperature_status\":null,\"humidity_level\":56.90,\"humidity_status\":null,\"moisture_status\":\"NORMAL\",\"gas_status\":\"NORMAL\",\"created_at\":1778580113000},\"thresholds\":{\"moisture_min\":40.00,\"gas_max\":40.00,\"updated_at\":1778397227000},\"analysisWindowDays\":21,\"actuatorSummary\":[]}', '{\n  \"predicted_condition\": \"HIGH_GAS_LEVEL\",\n  \"prediction_summary\": \"The compost batch, which started less than a day ago, is experiencing consistently high gas levels according to the system\'s set threshold (gas_max: 40.00). Moisture, temperature, and humidity are currently within optimal ranges. The high gas levels, if sustained without proper aeration, could lead to anaerobic conditions and significantly delay the composting process. There\'s an inconsistency where the latest reading\'s gas status is \'NORMAL\' despite the value being 700.00, which is far above the 40.00 threshold, suggesting a potential misconfiguration or discrepancy in threshold application.\",\n  \"estimated_ready_date\": null,\n  \"estimated_days_remaining\": null,\n  \"recommendation\": \"Immediately investigate the \'gas_max\' threshold setting (currently 40.00) as it appears to be extremely low compared to actual readings (average 860.05). If the threshold is correct, verify fan actuator functionality and its triggering logic, as no fan activity has been logged despite consistently high gas levels. Consider manual aeration to reduce current gas levels and prevent anaerobic conditions. Monitor gas levels closely after any adjustments.\",\n  \"trend_summary\": \"Moisture levels have been consistently optimal, well above the minimum threshold. Gas levels have been overwhelmingly high, exceeding the set \'gas_max\' threshold for almost all recorded readings (123 out of 125). Despite this, no fan actuator activity has been logged. Temperature and humidity have remained stable and within acceptable ranges for composting.\",\n  \"confidence_score\": 0.30\n}', '2026-05-12 14:16:29'),
(2, 1, 'READINESS_ESTIMATE', 125, 'NEEDS_ATTENTION', 'The compost batch is showing consistently high gas levels (average 860.06) significantly exceeding the maximum threshold (40.00), and suboptimal low temperatures (average 29.83°C). This indicates potential issues with aeration and microbial activity. Despite the high gas readings, no fan activity was logged. The batch has only just started (less than one day), making long-term predictions uncertain due to insufficient data over time.', NULL, NULL, 'Immediately investigate the fan actuator and its control logic to ensure it\'s functioning correctly and triggering when gas levels exceed the threshold. Consider turning the compost or adding more \'greens\' (nitrogen-rich materials) to increase microbial activity and temperature. Monitor gas and temperature trends closely.', 'Moisture levels are stable and within the normal range (average 66.45%). Gas levels have been consistently high (average 860.06, min 700.00, max 1201.00) compared to the threshold (40.00), with 123 out of 125 readings indicating high gas. Temperature is stable but low (average 29.83°C) for optimal composting. Humidity is stable (average 56.34%). No water spray or fan actuator activities were recorded during the analysis window.', '2026-05-10 15:09:57', '2026-05-12 18:01:53', 0.60, 'Gemini', 'gemini-2.5-flash', '{\"readingSummary\":{\"total_readings\":125,\"analysis_window_start\":1778396997000,\"analysis_window_end\":1778580113000,\"avg_moisture\":66.445600,\"min_moisture\":59.40,\"max_moisture\":69.60,\"low_moisture_count\":0,\"high_moisture_count\":0,\"avg_gas\":860.058400,\"min_gas\":700.00,\"max_gas\":1201.00,\"high_gas_count\":123,\"avg_temperature\":29.832800,\"min_temperature\":27.60,\"max_temperature\":33.40,\"low_temperature_count\":0,\"high_temperature_count\":0,\"avg_humidity\":56.336800,\"min_humidity\":54.10,\"max_humidity\":59.90,\"low_humidity_count\":0,\"high_humidity_count\":0},\"batch\":{\"batch_id\":1,\"batch_code\":\"BATCH-001\",\"batch_name\":\"Initial Compost Batch\",\"primary_material\":\"Biodegradable Waste\",\"material_description\":\"Initial compost batch using biodegradable waste collected for system testing.\",\"start_date\":1778515200000,\"expected_duration_days\":30,\"initial_estimated_ready_date\":1781107200000,\"latest_predicted_ready_date\":null,\"actual_ready_date\":null,\"status\":\"ACTIVE\",\"bin_location\":\"Barangay Compost Area\",\"notes\":\"Default batch used for initial testing and AI prediction integration.\"},\"latestReading\":{\"reading_id\":125,\"batch_id\":1,\"moisture_level\":59.40,\"gas_level\":700.00,\"temperature_c\":29.70,\"temperature_status\":null,\"humidity_level\":56.90,\"humidity_status\":null,\"moisture_status\":\"NORMAL\",\"gas_status\":\"NORMAL\",\"created_at\":1778580113000},\"thresholds\":{\"moisture_min\":40.00,\"gas_max\":40.00,\"updated_at\":1778397227000},\"analysisWindowDays\":21,\"actuatorSummary\":[]}', '{\n  \"predicted_condition\": \"NEEDS_ATTENTION\",\n  \"prediction_summary\": \"The compost batch is showing consistently high gas levels (average 860.06) significantly exceeding the maximum threshold (40.00), and suboptimal low temperatures (average 29.83°C). This indicates potential issues with aeration and microbial activity. Despite the high gas readings, no fan activity was logged. The batch has only just started (less than one day), making long-term predictions uncertain due to insufficient data over time.\",\n  \"estimated_ready_date\": null,\n  \"estimated_days_remaining\": null,\n  \"recommendation\": \"Immediately investigate the fan actuator and its control logic to ensure it\'s functioning correctly and triggering when gas levels exceed the threshold. Consider turning the compost or adding more \'greens\' (nitrogen-rich materials) to increase microbial activity and temperature. Monitor gas and temperature trends closely.\",\n  \"trend_summary\": \"Moisture levels are stable and within the normal range (average 66.45%). Gas levels have been consistently high (average 860.06, min 700.00, max 1201.00) compared to the threshold (40.00), with 123 out of 125 readings indicating high gas. Temperature is stable but low (average 29.83°C) for optimal composting. Humidity is stable (average 56.34%). No water spray or fan actuator activities were recorded during the analysis window.\",\n  \"confidence_score\": 0.60\n}', '2026-05-12 15:34:05');

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
(1, 'BATCH-001', 'Initial Compost Batch', 'Biodegradable Waste', 'Initial compost batch using biodegradable waste collected for system testing.', '2026-05-12', 30, '2026-06-11', NULL, NULL, 'ACTIVE', 'Barangay Compost Area', 'Default batch used for initial testing and AI prediction integration.', NULL, '2026-05-12 12:53:29', '2026-05-12 12:53:29');

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
(1, 1, 66.00, 1201.00, 28.50, NULL, 54.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:09:57'),
(2, 1, 66.00, 1201.00, 28.50, NULL, 54.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:09:57'),
(3, 1, 66.00, 1201.00, 28.50, NULL, 54.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:10:01'),
(4, 1, 66.00, 1201.00, 28.50, NULL, 54.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:10:01'),
(5, 1, 66.00, 1201.00, 28.50, NULL, 54.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:10:02'),
(6, 1, 66.00, 1201.00, 28.50, NULL, 54.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:10:02'),
(7, 1, 66.00, 1201.00, 28.50, NULL, 54.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:10:02'),
(8, 1, 66.00, 1201.00, 28.50, NULL, 54.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:10:02'),
(9, 1, 66.00, 1201.00, 28.50, NULL, 54.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:10:04'),
(10, 1, 66.00, 1201.00, 28.50, NULL, 54.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:10:04'),
(11, 1, 65.50, 1120.10, 29.20, NULL, 55.80, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:11:04'),
(12, 1, 66.00, 1119.60, 27.70, NULL, 55.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:11:04'),
(13, 1, 66.40, 1038.70, 27.80, NULL, 55.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:12:04'),
(14, 1, 66.90, 1037.50, 27.80, NULL, 55.10, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:12:04'),
(15, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:13:04'),
(16, 1, 67.50, 956.50, 27.70, NULL, 54.10, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:13:04'),
(17, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:13:56'),
(18, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:13:56'),
(19, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:13:57'),
(20, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:13:57'),
(21, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:18'),
(22, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:18'),
(23, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:20'),
(24, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:20'),
(25, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:21'),
(26, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:21'),
(27, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:25'),
(28, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:25'),
(29, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:27'),
(30, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:27'),
(31, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:28'),
(32, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:28'),
(33, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:29'),
(34, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:29'),
(35, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:31'),
(36, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:31'),
(37, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:32'),
(38, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:32'),
(39, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:34'),
(40, 1, 67.00, 953.80, 27.60, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:14:34'),
(41, 1, 67.80, 875.80, 28.30, NULL, 54.20, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:15:34'),
(42, 1, 67.80, 871.20, 28.50, NULL, 55.10, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:15:34'),
(43, 1, 68.80, 791.30, 29.40, NULL, 55.70, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:16:34'),
(44, 1, 67.20, 793.00, 28.50, NULL, 55.20, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:16:34'),
(45, 1, 69.60, 780.00, 29.60, NULL, 55.00, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:17:34'),
(46, 1, 68.40, 780.00, 29.50, NULL, 55.60, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:17:34'),
(47, 1, 68.70, 780.00, 28.60, NULL, 54.80, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:18:34'),
(48, 1, 68.00, 780.00, 30.40, NULL, 55.80, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:18:34'),
(49, 1, 67.50, 780.00, 30.80, NULL, 54.80, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:19:34'),
(50, 1, 68.10, 780.00, 31.30, NULL, 55.20, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:19:34'),
(51, 1, 66.80, 780.00, 30.60, NULL, 54.50, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:20:34'),
(52, 1, 67.00, 780.00, 30.10, NULL, 55.60, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:20:34'),
(53, 1, 67.90, 780.00, 30.00, NULL, 55.20, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:21:38'),
(54, 1, 67.00, 780.00, 29.60, NULL, 55.10, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:21:38'),
(55, 1, 66.80, 780.00, 29.60, NULL, 54.80, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:22:38'),
(56, 1, 66.30, 780.00, 30.40, NULL, 56.00, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:22:38'),
(57, 1, 65.50, 780.00, 30.30, NULL, 55.30, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:23:38'),
(58, 1, 65.40, 780.00, 30.50, NULL, 55.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:23:38'),
(59, 1, 65.50, 780.00, 29.90, NULL, 54.70, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:24:38'),
(60, 1, 66.20, 780.00, 29.40, NULL, 54.60, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:24:38'),
(61, 1, 66.10, 780.00, 29.10, NULL, 54.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:25:34'),
(62, 1, 65.30, 780.00, 29.60, NULL, 55.20, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:25:34'),
(63, 1, 65.40, 780.00, 29.50, NULL, 55.00, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:26:35'),
(64, 1, 64.90, 780.00, 29.10, NULL, 55.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:26:35'),
(65, 1, 65.80, 780.00, 29.50, NULL, 55.20, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:27:36'),
(66, 1, 64.90, 780.00, 30.40, NULL, 54.70, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:27:36'),
(67, 1, 65.00, 780.00, 30.90, NULL, 54.30, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:28:37'),
(68, 1, 65.40, 780.00, 31.00, NULL, 55.70, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:28:37'),
(69, 1, 64.80, 780.00, 30.70, NULL, 56.20, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:29:38'),
(70, 1, 66.20, 780.00, 31.80, NULL, 55.70, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:29:38'),
(71, 1, 65.90, 780.00, 32.10, NULL, 56.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:30:34'),
(72, 1, 66.40, 780.00, 31.60, NULL, 56.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:30:34'),
(73, 1, 66.50, 780.00, 30.80, NULL, 56.20, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:31:34'),
(74, 1, 65.80, 780.00, 32.50, NULL, 57.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:31:34'),
(75, 1, 65.40, 780.00, 31.80, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:32:34'),
(76, 1, 65.90, 780.00, 33.40, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:32:34'),
(77, 1, 64.80, 780.00, 32.10, NULL, 57.50, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:33:34'),
(78, 1, 66.00, 780.00, 31.30, NULL, 58.30, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:33:34'),
(79, 1, 65.10, 780.00, 30.70, NULL, 59.00, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:34:34'),
(80, 1, 66.70, 780.00, 31.90, NULL, 58.50, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:34:34'),
(81, 1, 66.10, 780.00, 31.30, NULL, 59.50, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:35:35'),
(82, 1, 67.30, 780.00, 32.30, NULL, 59.10, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:35:35'),
(83, 1, 68.20, 780.00, 31.70, NULL, 59.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:36:34'),
(84, 1, 66.50, 780.00, 32.00, NULL, 59.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:36:34'),
(85, 1, 65.80, 780.00, 32.70, NULL, 59.10, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:37:38'),
(86, 1, 66.50, 780.00, 31.40, NULL, 59.60, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:37:38'),
(87, 1, 67.10, 780.00, 30.80, NULL, 59.10, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:38:38'),
(88, 1, 66.60, 780.00, 31.30, NULL, 59.50, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:38:38'),
(89, 1, 65.70, 780.00, 32.00, NULL, 58.80, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:39:38'),
(90, 1, 66.90, 780.00, 31.70, NULL, 59.10, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:39:38'),
(91, 1, 65.60, 780.00, 31.40, NULL, 58.60, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:40:38'),
(92, 1, 66.30, 780.00, 32.60, NULL, 58.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:40:38'),
(93, 1, 64.90, 780.00, 31.90, NULL, 57.80, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:41:38'),
(94, 1, 64.60, 780.00, 31.80, NULL, 58.10, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:41:38'),
(95, 1, 65.50, 780.00, 31.80, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:42:34'),
(96, 1, 65.80, 780.00, 32.90, NULL, 58.30, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:42:34'),
(97, 1, 66.20, 780.00, 32.20, NULL, 58.80, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:43:38'),
(98, 1, 66.50, 780.00, 31.20, NULL, 57.70, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:43:38'),
(99, 1, 66.50, 780.00, 30.50, NULL, 58.10, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:44:38'),
(100, 1, 67.20, 780.00, 30.60, NULL, 56.70, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:44:38'),
(101, 1, 66.30, 780.00, 30.70, NULL, 58.40, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:45:34'),
(102, 1, 66.20, 780.00, 30.80, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:45:34'),
(103, 1, 66.20, 780.00, 30.80, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:45:51'),
(104, 1, 66.20, 780.00, 30.80, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:45:51'),
(105, 1, 66.20, 780.00, 30.80, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:46:58'),
(106, 1, 66.20, 780.00, 30.80, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:46:58'),
(107, 1, 66.20, 780.00, 30.80, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:47:12'),
(108, 1, 66.20, 780.00, 30.80, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:47:12'),
(109, 1, 66.20, 780.00, 30.80, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:47:43'),
(110, 1, 66.20, 780.00, 30.80, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:47:43'),
(111, 1, 66.20, 780.00, 30.80, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:51:10'),
(112, 1, 66.20, 780.00, 30.80, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:51:10'),
(113, 1, 66.20, 780.00, 30.80, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:53:49'),
(114, 1, 66.20, 780.00, 30.80, NULL, 57.90, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:53:49'),
(115, 1, 65.30, 780.00, 31.30, NULL, 58.10, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:54:49'),
(116, 1, 67.10, 780.00, 30.30, NULL, 58.60, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:54:49'),
(117, 1, 67.10, 780.00, 30.30, NULL, 58.60, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:56:18'),
(118, 1, 67.10, 780.00, 30.30, NULL, 58.60, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:56:18'),
(119, 1, 67.10, 780.00, 30.30, NULL, 58.60, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:56:44'),
(120, 1, 67.10, 780.00, 30.30, NULL, 58.60, NULL, 'NORMAL', 'HIGH', '2026-05-10 07:56:44'),
(121, 1, 67.10, 780.00, 30.30, NULL, 58.60, NULL, 'NORMAL', 'HIGH', '2026-05-12 08:37:55'),
(122, 1, 67.10, 780.00, 30.30, NULL, 58.60, NULL, 'NORMAL', 'HIGH', '2026-05-12 08:37:55'),
(123, 1, 68.50, 808.60, 30.10, NULL, 58.80, NULL, 'NORMAL', 'HIGH', '2026-05-12 08:39:16'),
(124, 1, 64.20, 700.00, 30.40, NULL, 57.80, NULL, 'NORMAL', 'NORMAL', '2026-05-12 10:01:50'),
(125, 1, 59.40, 700.00, 29.70, NULL, 56.90, NULL, 'NORMAL', 'NORMAL', '2026-05-12 10:01:53'),
(126, NULL, 61.20, 700.00, 29.00, NULL, 55.40, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:14:46'),
(127, NULL, 56.90, 700.00, 28.60, NULL, 53.70, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:15:46'),
(128, NULL, 57.80, 700.00, 28.70, NULL, 52.80, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:16:46'),
(129, NULL, 58.10, 700.00, 28.70, NULL, 52.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:17:46'),
(130, NULL, 57.00, 700.00, 28.80, NULL, 51.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:18:46'),
(131, NULL, 56.90, 700.00, 29.40, NULL, 49.70, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:19:46'),
(132, NULL, 60.70, 700.00, 29.60, NULL, 49.50, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:20:46'),
(133, NULL, 59.30, 700.00, 29.40, NULL, 47.90, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:21:46'),
(134, NULL, 62.20, 700.00, 29.20, NULL, 46.60, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:22:46'),
(135, NULL, 63.30, 700.00, 29.00, NULL, 46.20, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:23:46'),
(136, NULL, 63.90, 700.00, 29.30, NULL, 44.80, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:24:46'),
(137, NULL, 61.50, 700.00, 29.80, NULL, 43.50, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:25:46'),
(138, NULL, 59.30, 700.00, 30.00, NULL, 41.70, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:26:46'),
(139, NULL, 59.20, 700.00, 29.90, NULL, 40.50, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:27:46'),
(140, NULL, 57.90, 700.00, 30.30, NULL, 39.90, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:28:46'),
(141, NULL, 62.30, 700.00, 29.70, NULL, 38.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:29:46'),
(142, NULL, 60.00, 700.00, 29.80, NULL, 37.50, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:30:46'),
(143, NULL, 54.40, 700.00, 29.30, NULL, 36.50, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:31:46'),
(144, NULL, 55.10, 700.00, 30.00, NULL, 35.60, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:32:46'),
(145, NULL, 52.80, 700.00, 29.30, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:33:46'),
(146, NULL, 50.50, 700.00, 29.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:34:46'),
(147, NULL, 48.20, 700.00, 30.40, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:35:46'),
(148, NULL, 52.50, 700.00, 30.30, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:36:46'),
(149, NULL, 48.70, 700.00, 29.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:37:46'),
(150, NULL, 46.40, 700.00, 30.10, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:38:46'),
(151, NULL, 51.10, 700.00, 30.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:39:46'),
(152, NULL, 48.20, 700.00, 30.40, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:40:46'),
(153, NULL, 43.50, 700.00, 29.90, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:41:46'),
(154, NULL, 40.80, 700.00, 30.10, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:42:46'),
(155, NULL, 35.80, 700.00, 30.70, NULL, 35.00, NULL, 'LOW', 'NORMAL', '2026-05-12 13:43:46'),
(156, NULL, 52.00, 700.00, 30.30, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:44:46'),
(157, NULL, 56.30, 700.00, 30.90, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:45:46'),
(158, NULL, 52.30, 700.00, 30.20, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:46:46'),
(159, NULL, 53.70, 700.00, 30.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:47:46'),
(160, NULL, 50.70, 700.00, 30.30, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 13:48:46'),
(161, NULL, 54.50, 700.00, 30.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:15:34'),
(162, NULL, 51.60, 700.00, 30.00, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:16:34'),
(163, NULL, 47.20, 700.00, 29.90, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:17:34'),
(164, NULL, 43.10, 700.00, 30.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:18:34'),
(165, NULL, 38.40, 700.00, 30.70, NULL, 35.00, NULL, 'LOW', 'NORMAL', '2026-05-12 14:19:34'),
(166, NULL, 51.20, 700.00, 30.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:20:34'),
(167, NULL, 53.70, 700.00, 30.40, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:21:34'),
(168, NULL, 58.80, 700.00, 30.10, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:22:34'),
(169, NULL, 58.40, 700.00, 30.00, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:23:34'),
(170, NULL, 61.70, 700.00, 30.40, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:24:34'),
(171, NULL, 59.00, 700.00, 30.90, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:25:34'),
(172, NULL, 60.30, 700.00, 31.00, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:26:34'),
(173, NULL, 60.90, 700.00, 31.30, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:27:34'),
(174, NULL, 62.00, 700.00, 30.90, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:28:34'),
(175, NULL, 57.70, 700.00, 30.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:29:34'),
(176, NULL, 54.80, 700.00, 30.40, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:30:36'),
(177, NULL, 51.10, 700.00, 30.50, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:31:36'),
(178, NULL, 50.10, 700.00, 30.20, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:32:36'),
(179, NULL, 49.60, 700.00, 30.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:33:36'),
(180, NULL, 50.40, 700.00, 31.20, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:34:36'),
(181, NULL, 54.30, 700.00, 30.50, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:35:36'),
(182, NULL, 52.50, 700.00, 30.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:36:36'),
(183, NULL, 57.60, 700.00, 30.30, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:37:36'),
(184, NULL, 61.00, 700.00, 29.70, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:38:36'),
(185, NULL, 58.90, 700.00, 29.90, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:39:36'),
(186, NULL, 58.80, 700.00, 29.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:40:36'),
(187, NULL, 56.90, 700.00, 29.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:41:36'),
(188, NULL, 59.50, 700.00, 30.30, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:42:36'),
(189, NULL, 55.90, 700.00, 31.00, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:43:36'),
(190, NULL, 50.70, 700.00, 30.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:44:36'),
(191, NULL, 47.40, 700.00, 31.30, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:45:36'),
(192, NULL, 51.40, 700.00, 30.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:46:36'),
(193, NULL, 55.20, 700.00, 30.10, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:47:36'),
(194, NULL, 57.60, 700.00, 29.70, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:48:36'),
(195, NULL, 57.50, 700.00, 30.10, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:49:36'),
(196, NULL, 57.50, 700.00, 29.40, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:50:36'),
(197, NULL, 58.80, 700.00, 29.50, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:51:36'),
(198, NULL, 55.20, 700.00, 29.20, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:52:36'),
(199, NULL, 56.80, 700.00, 28.90, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:53:36'),
(200, NULL, 59.80, 700.00, 28.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:54:36'),
(201, NULL, 58.60, 700.00, 29.20, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:55:36'),
(202, NULL, 60.20, 700.00, 28.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:56:36'),
(203, NULL, 55.50, 700.00, 29.00, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:57:36'),
(204, NULL, 54.80, 700.00, 29.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:58:36'),
(205, NULL, 58.90, 700.00, 29.70, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 14:59:36'),
(206, NULL, 55.50, 700.00, 29.70, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:00:36'),
(207, NULL, 52.70, 700.00, 29.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:01:36'),
(208, NULL, 48.70, 700.00, 29.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:02:36'),
(209, NULL, 46.20, 700.00, 28.90, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:03:36'),
(210, NULL, 46.30, 700.00, 28.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:04:36'),
(211, NULL, 45.20, 700.00, 29.50, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:05:36'),
(212, NULL, 41.60, 700.00, 29.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:06:36'),
(213, NULL, 40.00, 700.00, 29.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:07:36'),
(214, NULL, 36.40, 700.00, 29.50, NULL, 35.00, NULL, 'LOW', 'NORMAL', '2026-05-12 15:08:36'),
(215, NULL, 52.40, 700.00, 29.50, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:09:36'),
(216, NULL, 49.90, 700.00, 29.10, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:10:36'),
(217, NULL, 47.90, 700.00, 28.40, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:11:36'),
(218, NULL, 49.00, 700.00, 27.90, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:12:36'),
(219, NULL, 48.80, 700.00, 28.20, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:13:36'),
(220, NULL, 50.10, 700.00, 28.40, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:14:36'),
(221, NULL, 51.80, 700.00, 27.90, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:15:36'),
(222, NULL, 47.70, 700.00, 27.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:16:36'),
(223, NULL, 51.60, 700.00, 27.70, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:17:36'),
(224, NULL, 49.00, 700.00, 28.00, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:18:36'),
(225, NULL, 52.10, 700.00, 27.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:19:36'),
(226, NULL, 49.10, 700.00, 27.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:20:36'),
(227, NULL, 47.10, 700.00, 27.20, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:21:36'),
(228, NULL, 43.50, 700.00, 27.30, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:22:36'),
(229, NULL, 47.00, 700.00, 27.40, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:23:36'),
(230, NULL, 51.20, 700.00, 27.20, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:24:36'),
(231, NULL, 49.50, 700.00, 26.50, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:25:36'),
(232, NULL, 49.40, 700.00, 27.00, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:26:36'),
(233, NULL, 47.20, 700.00, 27.50, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:27:36'),
(234, NULL, 49.10, 700.00, 28.10, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:28:36'),
(235, NULL, 44.90, 700.00, 27.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:29:36'),
(236, NULL, 49.30, 700.00, 27.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:30:36'),
(237, NULL, 49.00, 700.00, 28.30, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:31:36'),
(238, NULL, 46.70, 700.00, 28.00, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:32:36'),
(239, NULL, 48.40, 700.00, 28.10, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:33:36'),
(240, NULL, 48.80, 700.00, 28.50, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:34:36'),
(241, NULL, 50.60, 700.00, 28.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:35:36'),
(242, NULL, 52.70, 705.40, 28.90, NULL, 36.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:36:10'),
(243, NULL, 56.50, 700.00, 29.10, NULL, 35.30, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:36:36'),
(244, NULL, 57.30, 700.00, 29.00, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:37:36'),
(245, NULL, 57.10, 700.00, 29.00, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:38:36'),
(246, NULL, 52.40, 700.00, 29.40, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:39:36'),
(247, NULL, 52.80, 700.00, 29.90, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:40:36'),
(248, NULL, 50.10, 700.00, 30.10, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:41:36'),
(249, NULL, 54.80, 700.00, 30.00, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:42:36'),
(250, NULL, 49.80, 700.00, 30.70, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:43:36'),
(251, NULL, 53.50, 700.00, 30.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:44:36'),
(252, NULL, 51.20, 700.00, 31.20, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:45:36'),
(253, NULL, 49.00, 700.00, 31.00, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:46:36'),
(254, NULL, 45.40, 700.00, 31.50, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:47:36'),
(255, NULL, 49.00, 700.00, 31.70, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:48:36'),
(256, NULL, 48.40, 700.00, 31.10, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:49:36'),
(257, NULL, 51.80, 700.00, 30.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:50:36'),
(258, NULL, 56.00, 700.00, 30.10, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:51:36'),
(259, NULL, 54.60, 700.00, 29.70, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:52:36'),
(260, NULL, 58.30, 700.00, 29.70, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:53:36'),
(261, NULL, 56.60, 700.00, 29.70, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:54:36'),
(262, NULL, 54.20, 700.00, 29.70, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:55:36'),
(263, NULL, 58.20, 700.00, 29.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:56:36'),
(264, NULL, 59.70, 700.00, 30.10, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:57:36'),
(265, NULL, 62.40, 700.00, 30.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:58:36'),
(266, NULL, 60.10, 700.00, 31.20, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 15:59:36'),
(267, NULL, 58.00, 700.00, 30.70, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:00:36'),
(268, NULL, 54.00, 700.00, 30.90, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:01:36'),
(269, NULL, 49.50, 700.00, 30.70, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:02:36'),
(270, NULL, 46.90, 700.00, 31.30, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:03:36'),
(271, NULL, 46.90, 700.00, 30.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:04:36'),
(272, NULL, 44.40, 700.00, 31.50, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:05:36'),
(273, NULL, 42.30, 700.00, 31.10, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:06:36'),
(274, NULL, 41.60, 700.00, 30.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:07:36'),
(275, NULL, 41.70, 700.00, 31.00, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:08:36'),
(276, NULL, 43.10, 700.00, 30.40, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:14:06'),
(277, NULL, 47.30, 700.00, 30.50, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:14:06'),
(278, NULL, 47.70, 700.00, 30.80, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:14:06'),
(279, NULL, 43.70, 700.00, 31.30, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:14:06'),
(280, NULL, 40.70, 700.00, 31.50, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:14:06'),
(281, NULL, 41.50, 700.00, 32.00, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:14:36'),
(282, NULL, 42.50, 700.00, 31.50, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:15:36'),
(283, NULL, 41.20, 723.30, 31.90, NULL, 35.90, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:16:03'),
(284, NULL, 36.20, 700.00, 31.90, NULL, 35.00, NULL, 'LOW', 'NORMAL', '2026-05-12 16:16:36'),
(285, NULL, 45.20, 723.90, 32.00, NULL, 38.50, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:17:03'),
(286, NULL, 49.10, 700.00, 31.90, NULL, 36.80, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:17:36'),
(287, NULL, 48.00, 734.20, 31.40, NULL, 38.70, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:18:03'),
(288, NULL, 44.10, 700.00, 30.70, NULL, 38.30, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:18:36'),
(289, NULL, 51.80, 771.30, 31.10, NULL, 40.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:19:03'),
(290, NULL, 54.70, 700.00, 30.40, NULL, 39.30, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:19:36'),
(291, NULL, 50.10, 791.10, 30.60, NULL, 41.90, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:20:03'),
(292, NULL, 49.90, 700.00, 29.90, NULL, 41.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:20:36'),
(293, NULL, 55.30, 790.40, 30.80, NULL, 42.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:21:03'),
(294, NULL, 52.60, 700.00, 30.50, NULL, 41.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:21:36'),
(295, NULL, 59.80, 799.50, 30.50, NULL, 43.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:22:07'),
(296, NULL, 56.00, 700.00, 30.90, NULL, 41.40, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:22:36'),
(297, NULL, 58.20, 849.20, 31.00, NULL, 44.60, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:23:07'),
(298, NULL, 62.70, 700.00, 31.10, NULL, 44.20, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:23:36'),
(299, NULL, 62.30, 700.00, 31.50, NULL, 43.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:24:36'),
(300, NULL, 65.10, 700.00, 31.90, NULL, 42.70, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:25:36'),
(301, NULL, 66.80, 700.00, 32.40, NULL, 41.60, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:26:36'),
(302, NULL, 66.60, 700.00, 33.10, NULL, 40.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:27:36'),
(303, NULL, 61.70, 700.00, 32.70, NULL, 39.30, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:28:36'),
(304, NULL, 59.20, 700.00, 32.60, NULL, 38.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:29:36'),
(305, NULL, 64.70, 700.00, 31.90, NULL, 37.40, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:30:36'),
(306, NULL, 61.20, 700.00, 31.30, NULL, 37.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:31:36'),
(307, NULL, 62.30, 700.00, 31.70, NULL, 36.20, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:32:36'),
(308, NULL, 63.70, 700.00, 31.40, NULL, 36.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:33:36'),
(309, NULL, 61.70, 700.00, 32.10, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:34:36'),
(310, NULL, 63.30, 700.00, 32.60, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:35:36'),
(311, NULL, 60.80, 700.00, 33.00, NULL, 35.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:36:36'),
(312, NULL, 57.30, 817.00, 31.00, NULL, 44.60, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:37:04'),
(313, NULL, 61.10, 700.00, 30.60, NULL, 43.90, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:37:36'),
(314, NULL, 60.50, 849.40, 31.60, NULL, 46.50, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:38:05'),
(315, NULL, 60.60, 700.00, 31.80, NULL, 46.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:38:36'),
(316, NULL, 63.40, 822.20, 31.40, NULL, 47.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:39:06'),
(317, NULL, 59.80, 700.00, 31.70, NULL, 46.40, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:39:36'),
(318, NULL, 58.50, 869.00, 31.80, NULL, 46.80, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:40:07'),
(319, NULL, 60.70, 700.00, 31.30, NULL, 46.40, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:40:36'),
(320, NULL, 61.00, 823.10, 32.40, NULL, 46.60, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:41:07'),
(321, NULL, 61.20, 700.00, 32.30, NULL, 44.50, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:41:36'),
(322, NULL, 61.20, 792.50, 32.00, NULL, 45.90, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:42:07'),
(323, NULL, 60.10, 700.00, 31.50, NULL, 44.30, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:42:36'),
(324, NULL, 57.10, 822.30, 32.30, NULL, 46.50, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:43:07'),
(325, NULL, 57.10, 700.00, 33.00, NULL, 45.70, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:43:36'),
(326, NULL, 54.10, 813.70, 32.40, NULL, 47.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:44:07'),
(327, NULL, 54.10, 700.00, 32.70, NULL, 45.70, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:44:36'),
(328, NULL, 55.00, 828.60, 31.70, NULL, 46.70, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:45:07'),
(329, NULL, 56.10, 700.00, 32.10, NULL, 46.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:45:36'),
(330, NULL, 56.40, 863.70, 31.80, NULL, 46.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:46:07'),
(331, NULL, 59.60, 700.00, 31.10, NULL, 45.20, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:46:36'),
(332, NULL, 53.80, 832.60, 32.10, NULL, 45.50, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:47:07'),
(333, NULL, 49.20, 700.00, 32.60, NULL, 44.70, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:47:36'),
(334, NULL, 52.40, 853.60, 31.60, NULL, 45.80, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:48:07'),
(335, NULL, 54.00, 700.00, 32.10, NULL, 45.50, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:48:36'),
(336, NULL, 48.00, 841.70, 31.20, NULL, 46.20, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:49:07'),
(337, NULL, 52.50, 700.00, 31.80, NULL, 45.60, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:49:36'),
(338, NULL, 44.40, 880.40, 30.90, NULL, 46.40, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:50:07'),
(339, NULL, 40.30, 700.00, 30.50, NULL, 45.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:50:36'),
(340, NULL, 46.90, 907.70, 30.20, NULL, 47.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:51:07'),
(341, NULL, 49.00, 700.00, 30.70, NULL, 46.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:51:36'),
(342, NULL, 42.10, 903.60, 30.20, NULL, 46.60, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:52:07'),
(343, NULL, 47.00, 700.00, 30.90, NULL, 45.20, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:52:36'),
(344, NULL, 40.70, 893.20, 30.40, NULL, 46.10, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:53:07'),
(345, NULL, 45.40, 700.00, 30.80, NULL, 44.90, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:53:36'),
(346, NULL, 42.90, 921.00, 30.50, NULL, 45.40, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:54:07'),
(347, NULL, 46.20, 700.00, 31.00, NULL, 43.60, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:54:36'),
(348, NULL, 41.60, 933.90, 31.10, NULL, 45.00, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:55:07'),
(349, NULL, 37.70, 700.00, 31.60, NULL, 44.50, NULL, 'LOW', 'NORMAL', '2026-05-12 16:55:36'),
(350, NULL, 40.20, 968.20, 31.00, NULL, 45.40, NULL, 'NORMAL', 'NORMAL', '2026-05-12 16:56:07');

-- Normalize seeded statuses to the current sensor ranges:
-- moisture 50-70%, gas 800-1200 index, temperature 30-50 C, humidity 40-70% RH.
UPDATE `sensor_readings`
SET
  `moisture_status` = CASE
    WHEN `moisture_level` < 50.00 THEN 'LOW'
    WHEN `moisture_level` > 70.00 THEN 'HIGH'
    ELSE 'NORMAL'
  END,
  `gas_status` = CASE
    WHEN `gas_level` < 800.00 THEN 'LOW'
    WHEN `gas_level` > 1200.00 THEN 'HIGH'
    ELSE 'NORMAL'
  END,
  `temperature_status` = CASE
    WHEN `temperature_c` < 30.00 THEN 'LOW'
    WHEN `temperature_c` > 50.00 THEN 'HIGH'
    ELSE 'NORMAL'
  END,
  `humidity_status` = CASE
    WHEN `humidity_level` < 40.00 THEN 'LOW'
    WHEN `humidity_level` > 70.00 THEN 'HIGH'
    ELSE 'NORMAL'
  END;

UPDATE `sensor_readings`
SET `batch_id` = (
  SELECT `batch_id`
  FROM `compost_batches`
  WHERE `status` = 'ACTIVE'
  ORDER BY `start_date` DESC, `batch_id` DESC
  LIMIT 1
)
WHERE `batch_id` IS NULL
  AND EXISTS (
    SELECT 1
    FROM `compost_batches`
    WHERE `status` = 'ACTIVE'
  );

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
(1, 50.00, 1200.00, 1, '2026-05-07 21:09:38'),
(2, 50.00, 1200.00, NULL, '2026-05-10 07:13:47');

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
(4, 'Washushe', 'washushe@gmail.com', '5f9a3695817e78b2a246f3dce0db09ab0d1576de7f0dac6a8bea9d4adefd521f', '587fe635576192aeb82cd8033617d2b9d5463abe90f9104bb8d6270a56dd0eda', 'OPERATOR', '2026-05-08 09:40:54');

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
  MODIFY `prediction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `compost_batches`
--
ALTER TABLE `compost_batches`
  MODIFY `batch_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `sensor_readings`
--
ALTER TABLE `sensor_readings`
  MODIFY `reading_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=351;

--
-- AUTO_INCREMENT for table `threshold_settings`
--
ALTER TABLE `threshold_settings`
  MODIFY `setting_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
