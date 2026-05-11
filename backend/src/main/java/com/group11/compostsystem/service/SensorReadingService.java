package com.group11.compostsystem.service;

import com.group11.compostsystem.dto.SensorReadingRequest;
import com.group11.compostsystem.dto.SensorReadingResponse;
import com.group11.compostsystem.dto.ThresholdSettingsResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;

@Service
public class SensorReadingService {

    private final JdbcTemplate jdbcTemplate;
    private final ThresholdService thresholdService;

    public SensorReadingService(JdbcTemplate jdbcTemplate, ThresholdService thresholdService) {
        this.jdbcTemplate = jdbcTemplate;
        this.thresholdService = thresholdService;
    }

    public SensorReadingResponse saveSensorReading(SensorReadingRequest request) {
        ThresholdSettingsResponse threshold = thresholdService.getThresholdSettings();

        String moistureStatus = determineMoistureStatus(request.getMoistureLevel(), threshold.getMoistureMin());
        String gasStatus = determineGasStatus(request.getGasLevel(), threshold.getGasMax());

        String sql = "INSERT INTO sensor_readings (moisture_level, gas_level, temperature_c, humidity_level, moisture_status, gas_status) VALUES (?, ?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setBigDecimal(1, request.getMoistureLevel());
            ps.setBigDecimal(2, request.getGasLevel());
            ps.setBigDecimal(3, request.getTemperatureC());
            ps.setBigDecimal(4, request.getHumidityLevel());
            ps.setString(5, moistureStatus);
            ps.setString(6, gasStatus);
            return ps;
        }, keyHolder);

        Long id = keyHolder.getKey() != null ? keyHolder.getKey().longValue() : null;
        return new SensorReadingResponse(
                id,
                request.getMoistureLevel(),
                request.getGasLevel(),
                request.getTemperatureC(),
                request.getHumidityLevel(),
                moistureStatus,
                gasStatus,
                new Timestamp(System.currentTimeMillis())
        );
    }

    public SensorReadingResponse getLatestSensorReading() {
        return jdbcTemplate.queryForObject(
                "SELECT reading_id, moisture_level, gas_level, temperature_c, humidity_level, moisture_status, gas_status, created_at FROM sensor_readings ORDER BY reading_id DESC LIMIT 1",
                (rs, rowNum) -> new SensorReadingResponse(
                        rs.getLong("reading_id"),
                        rs.getBigDecimal("moisture_level"),
                        rs.getBigDecimal("gas_level"),
                        rs.getBigDecimal("temperature_c"),
                        rs.getBigDecimal("humidity_level"),
                        rs.getString("moisture_status"),
                        rs.getString("gas_status"),
                        rs.getTimestamp("created_at")
                )
        );
    }

    public List<SensorReadingResponse> getAllSensorReadings() {
        return jdbcTemplate.query(
                "SELECT reading_id, moisture_level, gas_level, temperature_c, humidity_level, moisture_status, gas_status, created_at FROM sensor_readings ORDER BY reading_id DESC",
                (rs, rowNum) -> new SensorReadingResponse(
                        rs.getLong("reading_id"),
                        rs.getBigDecimal("moisture_level"),
                        rs.getBigDecimal("gas_level"),
                        rs.getBigDecimal("temperature_c"),
                        rs.getBigDecimal("humidity_level"),
                        rs.getString("moisture_status"),
                        rs.getString("gas_status"),
                        rs.getTimestamp("created_at")
                )
        );
    }

    private String determineMoistureStatus(BigDecimal moistureLevel, BigDecimal moistureMin) {
        if (moistureLevel.compareTo(moistureMin) < 0) {
            return "LOW";
        }
        if (moistureLevel.compareTo(new BigDecimal("70")) > 0) {
            return "HIGH";
        }
        return "NORMAL";
    }

    private static final BigDecimal GAS_HIGH_THRESHOLD = new BigDecimal("1200");

    private String determineGasStatus(BigDecimal gasLevel, BigDecimal gasMax) {
        return gasLevel.compareTo(GAS_HIGH_THRESHOLD) > 0 ? "HIGH" : "NORMAL";
    }
}
