package com.group11.compostsystem.service;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import com.group11.compostsystem.dto.SensorReadingRequest;
import com.group11.compostsystem.dto.SensorReadingResponse;
import com.group11.compostsystem.dto.ThresholdSettingsResponse;

@Service
public class SensorReadingService {

    private final JdbcTemplate jdbcTemplate;
    private final ThresholdService thresholdService;

    public SensorReadingService(JdbcTemplate jdbcTemplate, ThresholdService thresholdService) {
        this.jdbcTemplate = jdbcTemplate;
        this.thresholdService = thresholdService;
    }

    private static final String STATUS_LOW = "LOW";
    private static final String STATUS_NORMAL = "NORMAL";
    private static final String STATUS_HIGH = "HIGH";

    private static final BigDecimal GAS_LOW_THRESHOLD = new BigDecimal("800");
    private static final BigDecimal GAS_HIGH_THRESHOLD = new BigDecimal("1200");

    public SensorReadingResponse saveSensorReading(SensorReadingRequest request) {

        ThresholdSettingsResponse threshold = thresholdService.getThresholdSettings();

        String moistureStatus = determineMoistureStatus(
                request.getMoistureLevel(),
                threshold.getMoistureMin()
        );

        String gasStatus = determineGasStatus(
                request.getGasLevel(),
                threshold.getGasMax()
        );

        String temperatureStatus = determineTemperatureStatus(
                request.getTemperatureC()
        );

        String humidityStatus = determineHumidityStatus(
                request.getHumidityLevel()
        );

        String sql = """
            INSERT INTO sensor_readings
            (
                moisture_level,
                gas_level,
                temperature_c,
                humidity_level,
                moisture_status,
                gas_status,
                temperature_status,
                humidity_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """;

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {

            PreparedStatement ps = connection.prepareStatement(
                    sql,
                    Statement.RETURN_GENERATED_KEYS
            );

            ps.setBigDecimal(1, request.getMoistureLevel());
            ps.setBigDecimal(2, request.getGasLevel());
            ps.setBigDecimal(3, request.getTemperatureC());
            ps.setBigDecimal(4, request.getHumidityLevel());

            ps.setString(5, moistureStatus);
            ps.setString(6, gasStatus);
            ps.setString(7, temperatureStatus);
            ps.setString(8, humidityStatus);

            return ps;

        }, keyHolder);

        Long id = keyHolder.getKey() != null
                ? keyHolder.getKey().longValue()
                : null;

        return new SensorReadingResponse(
                id,
                request.getMoistureLevel(),
                request.getGasLevel(),
                request.getTemperatureC(),
                request.getHumidityLevel(),
                moistureStatus,
                gasStatus,
                temperatureStatus,
                humidityStatus,
                new Timestamp(System.currentTimeMillis())
        );
    }

    public SensorReadingResponse getLatestSensorReading() {

        try {

            String sql = """
                SELECT
                    reading_id,
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
                ORDER BY reading_id DESC
                LIMIT 1
            """;

            return jdbcTemplate.queryForObject(sql, (rs, rowNum) ->
                    new SensorReadingResponse(
                            rs.getLong("reading_id"),
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

        String sql = """
            SELECT
                reading_id,
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
            ORDER BY reading_id DESC
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                new SensorReadingResponse(
                        rs.getLong("reading_id"),
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

    private String determineMoistureStatus(
            BigDecimal moistureLevel,
            BigDecimal moistureMin
    ) {

        if (moistureLevel == null || moistureMin == null) {
            return STATUS_NORMAL;
        }

        if (moistureLevel.compareTo(moistureMin) < 0) {
            return STATUS_LOW;
        }

        if (moistureLevel.compareTo(new BigDecimal("70")) > 0) {
            return STATUS_HIGH;
        }

        return STATUS_NORMAL;
    }

    private String determineGasStatus(
            BigDecimal gasLevel,
            BigDecimal gasMax
    ) {

        if (gasLevel == null) {
            return STATUS_NORMAL;
        }

        if (gasMax == null) {
            gasMax = GAS_HIGH_THRESHOLD;
        }

        if (gasLevel.compareTo(GAS_LOW_THRESHOLD) < 0) {
            return STATUS_LOW;
        }

        if (gasLevel.compareTo(gasMax) > 0) {
            return STATUS_HIGH;
        }

        return STATUS_NORMAL;
    }

    private String determineTemperatureStatus(BigDecimal temperatureC) {

        if (temperatureC == null) {
            return STATUS_NORMAL;
        }

        if (temperatureC.compareTo(new BigDecimal("25")) < 0) {
            return STATUS_LOW;
        }

        if (temperatureC.compareTo(new BigDecimal("35")) > 0) {
            return STATUS_HIGH;
        }

        return STATUS_NORMAL;
    }

    private String determineHumidityStatus(BigDecimal humidityLevel) {

        if (humidityLevel == null) {
            return STATUS_NORMAL;
        }

        if (humidityLevel.compareTo(new BigDecimal("45")) < 0) {
            return STATUS_LOW;
        }

        if (humidityLevel.compareTo(new BigDecimal("75")) > 0) {
            return STATUS_HIGH;
        }

        return STATUS_NORMAL;
    }
}