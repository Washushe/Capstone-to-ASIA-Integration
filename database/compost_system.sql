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

CREATE TABLE compost_batches (
    batch_id INT AUTO_INCREMENT PRIMARY KEY,

    batch_code VARCHAR(30) NOT NULL UNIQUE,
    batch_name VARCHAR(100) NOT NULL,

    primary_material VARCHAR(100) NOT NULL,
    material_description TEXT NULL,

    start_date DATE NOT NULL,
    expected_duration_days INT NULL,

    initial_estimated_ready_date DATE NULL,
    latest_predicted_ready_date DATE NULL,
    actual_ready_date DATE NULL,

    status ENUM(
        'ACTIVE',
        'READY_FOR_CHECKING',
        'READY',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'ACTIVE',

    bin_location VARCHAR(100) NULL,
    notes TEXT NULL,

    created_by INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_compost_batches_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

INSERT INTO compost_batches (
    batch_code,
    batch_name,
    primary_material,
    material_description,
    start_date,
    expected_duration_days,
    initial_estimated_ready_date,
    status,
    bin_location,
    notes,
    created_by
)
VALUES (
    'BATCH-001',
    'Initial Compost Batch',
    'Biodegradable Waste',
    'Initial compost batch using biodegradable waste collected for system testing.',
    CURDATE(),
    30,
    DATE_ADD(CURDATE(), INTERVAL 30 DAY),
    'ACTIVE',
    'Barangay Compost Area',
    'Default batch used for initial testing and AI prediction integration.',
    NULL
);

ALTER TABLE sensor_readings
ADD COLUMN batch_id INT NULL AFTER reading_id;

ALTER TABLE actuator_logs
ADD COLUMN batch_id INT NULL AFTER log_id;

ALTER TABLE ai_predictions
ADD COLUMN batch_id INT NULL AFTER prediction_id;

UPDATE sensor_readings
SET batch_id = 1
WHERE batch_id IS NULL;

UPDATE actuator_logs
SET batch_id = 1
WHERE batch_id IS NULL;

UPDATE ai_predictions
SET batch_id = 1
WHERE batch_id IS NULL;

--Add foreign key connections
ALTER TABLE sensor_readings
ADD CONSTRAINT fk_sensor_readings_batch
FOREIGN KEY (batch_id)
REFERENCES compost_batches(batch_id)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE actuator_logs
ADD CONSTRAINT fk_actuator_logs_batch
FOREIGN KEY (batch_id)
REFERENCES compost_batches(batch_id)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE ai_predictions
ADD CONSTRAINT fk_ai_predictions_batch
FOREIGN KEY (batch_id)
REFERENCES compost_batches(batch_id)
ON DELETE SET NULL
ON UPDATE CASCADE;

--Improve ai_predictions table
ALTER TABLE ai_predictions
ADD COLUMN prediction_type ENUM(
    'READINESS_ESTIMATE',
    'CONDITION_ANALYSIS',
    'SAFETY_ALERT'
) NOT NULL DEFAULT 'READINESS_ESTIMATE' AFTER batch_id,

ADD COLUMN estimated_ready_date DATE NULL AFTER prediction_summary,
ADD COLUMN estimated_days_remaining INT NULL AFTER estimated_ready_date,

ADD COLUMN trend_summary TEXT NULL AFTER recommendation,
ADD COLUMN analysis_window_start DATETIME NULL AFTER trend_summary,
ADD COLUMN analysis_window_end DATETIME NULL AFTER analysis_window_start,

ADD COLUMN model_provider VARCHAR(50) NULL DEFAULT 'Gemini' AFTER confidence_score,
ADD COLUMN model_name VARCHAR(100) NULL AFTER model_provider,

ADD COLUMN input_snapshot LONGTEXT NULL AFTER model_name,
ADD COLUMN raw_ai_response LONGTEXT NULL AFTER input_snapshot;

--add temperature and humidity status
ALTER TABLE sensor_readings
ADD COLUMN temperature_status ENUM('LOW','NORMAL','HIGH') NULL AFTER temperature_c,
ADD COLUMN humidity_status ENUM('LOW','NORMAL','HIGH') NULL AFTER humidity_level;

