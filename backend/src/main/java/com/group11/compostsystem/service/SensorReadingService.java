package com.group11.compostsystem.service;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.group11.compostsystem.dto.ActuatorActionResponse;
import com.group11.compostsystem.dto.SensorReadingRequest;
import com.group11.compostsystem.dto.SensorReadingResponse;
import com.group11.compostsystem.dto.ThresholdSettingsResponse;

@Service
public class SensorReadingService {

    private final JdbcTemplate jdbcTemplate;
    private final ThresholdService thresholdService;
    private final ActuatorLogService actuatorLogService;

    public SensorReadingService(JdbcTemplate jdbcTemplate,
                                ThresholdService thresholdService,
                                ActuatorLogService actuatorLogService) {
        this.jdbcTemplate = jdbcTemplate;
        this.thresholdService = thresholdService;
        this.actuatorLogService = actuatorLogService;
    }

    public SensorReadingResponse saveSensorReading(SensorReadingRequest request) {

        SensorReadingResponse response = jdbcTemplate.queryForObject(
                "CALL sp_save_sensor_reading(?, ?, ?, ?, ?)",
                (rs, rowNum) -> mapSensorReading(rs.getLong("reading_id"),
                        rs.getObject("batch_id", Integer.class),
                        rs.getBigDecimal("moisture_level"),
                        rs.getBigDecimal("gas_level"),
                        rs.getBigDecimal("temperature_c"),
                        rs.getBigDecimal("humidity_level"),
                        rs.getString("moisture_status"),
                        rs.getString("gas_status"),
                        rs.getString("temperature_status"),
                        rs.getString("humidity_status"),
                        rs.getTimestamp("created_at")),
                request.getBatchId(),
                request.getMoistureLevel(),
                request.getGasLevel(),
                request.getTemperatureC(),
                request.getHumidityLevel()
        );

        ThresholdSettingsResponse threshold = thresholdService.getThresholdSettings();
        List<ActuatorActionResponse> actions = actuatorLogService.applyAutomaticControl(response, threshold);
        response.setActuatorActions(actions);

        return response;
    }

    public SensorReadingResponse getLatestSensorReading() {

        try {

            return jdbcTemplate.queryForObject("CALL sp_get_latest_sensor_reading()", (rs, rowNum) ->
                    mapSensorReading(
                            rs.getLong("reading_id"),
                            rs.getObject("batch_id", Integer.class),
                            rs.getBigDecimal("moisture_level"),
                            rs.getBigDecimal("gas_level"),
                            rs.getBigDecimal("temperature_c"),
                            rs.getBigDecimal("humidity_level"),
                            rs.getString("moisture_status"),
                            rs.getString("gas_status"),
                            rs.getString("temperature_status"),
                            rs.getString("humidity_status"),
                            rs.getTimestamp("created_at")
                    )
            );

        } catch (EmptyResultDataAccessException ex) {
            return null;
        }
    }

    public List<SensorReadingResponse> getAllSensorReadings() {

        return jdbcTemplate.query("CALL sp_get_sensor_reading_history()", (rs, rowNum) ->
                mapSensorReading(
                        rs.getLong("reading_id"),
                        rs.getObject("batch_id", Integer.class),
                        rs.getBigDecimal("moisture_level"),
                        rs.getBigDecimal("gas_level"),
                        rs.getBigDecimal("temperature_c"),
                        rs.getBigDecimal("humidity_level"),
                        rs.getString("moisture_status"),
                        rs.getString("gas_status"),
                        rs.getString("temperature_status"),
                        rs.getString("humidity_status"),
                        rs.getTimestamp("created_at")
                )
        );
    }

    private SensorReadingResponse mapSensorReading(Long readingId,
                                                   Integer batchId,
                                                   BigDecimal moistureLevel,
                                                   BigDecimal gasLevel,
                                                   BigDecimal temperatureC,
                                                   BigDecimal humidityLevel,
                                                   String moistureStatus,
                                                   String gasStatus,
                                                   String temperatureStatus,
                                                   String humidityStatus,
                                                   Timestamp createdAt) {
        return new SensorReadingResponse(
                readingId,
                batchId,
                moistureLevel,
                gasLevel,
                temperatureC,
                humidityLevel,
                moistureStatus,
                gasStatus,
                temperatureStatus,
                humidityStatus,
                createdAt
        );
    }
}
