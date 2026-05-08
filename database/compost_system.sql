CREATE DATABASE IF NOT EXISTS compost_system;
USE compost_system;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN') NOT NULL DEFAULT 'ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE threshold_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    moisture_min DECIMAL(5,2) NOT NULL,
    gas_max DECIMAL(8,2) NOT NULL,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE sensor_readings (
    reading_id INT AUTO_INCREMENT PRIMARY KEY,
    moisture_level DECIMAL(5,2) NOT NULL,
    gas_level DECIMAL(8,2) NOT NULL,
    temperature_c DECIMAL(5,2) NOT NULL,
    humidity_level DECIMAL(5,2) NOT NULL,
    moisture_status ENUM('LOW', 'NORMAL', 'HIGH') NOT NULL,
    gas_status ENUM('NORMAL', 'HIGH') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE actuator_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    actuator_type ENUM('FAN', 'WATER_SPRAY') NOT NULL,
    status ENUM('ON', 'OFF') NOT NULL,
    trigger_source ENUM('AUTO', 'MANUAL', 'SAFETY') NOT NULL DEFAULT 'AUTO',
    related_reading_id INT,
    triggered_by_user_id INT,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (related_reading_id) REFERENCES sensor_readings(reading_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    FOREIGN KEY (triggered_by_user_id) REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE ai_predictions (
    prediction_id INT AUTO_INCREMENT PRIMARY KEY,
    reading_id INT NOT NULL,
    predicted_condition ENUM(
        'OPTIMAL',
        'TOO_DRY',
        'TOO_WET',
        'HIGH_GAS_LEVEL',
        'HIGH_TEMPERATURE',
        'LOW_TEMPERATURE',
        'HIGH_HUMIDITY',
        'LOW_HUMIDITY',
        'NEEDS_ATTENTION'
    ) NOT NULL,
    prediction_summary TEXT NOT NULL,
    recommendation TEXT,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reading_id) REFERENCES sensor_readings(reading_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);