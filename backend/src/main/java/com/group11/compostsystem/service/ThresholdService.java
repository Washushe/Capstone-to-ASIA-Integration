package com.group11.compostsystem.service;

import com.group11.compostsystem.dto.ThresholdSettingsRequest;
import com.group11.compostsystem.dto.ThresholdSettingsResponse;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class ThresholdService {

    private final JdbcTemplate jdbcTemplate;

    public ThresholdService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public ThresholdSettingsResponse getThresholdSettings() {
        try {
            return jdbcTemplate.queryForObject(
                    "CALL sp_get_threshold_settings()",
                    (rs, rowNum) -> new ThresholdSettingsResponse(
                            rs.getBigDecimal("moisture_min"),
                            rs.getBigDecimal("gas_max"),
                            rs.getInt("reading_interval_seconds"),
                            rs.getInt("spray_duration_seconds"),
                            rs.getInt("fan_duration_seconds"),
                            rs.getInt("spray_cooldown_seconds"),
                            rs.getInt("fan_cooldown_seconds"),
                            rs.getObject("updated_by", Integer.class),
                            rs.getTimestamp("updated_at")
                    )
            );
        } catch (EmptyResultDataAccessException ex) {
            return defaultThresholdSettings();
        }
    }

    public ThresholdSettingsResponse saveThresholdSettings(ThresholdSettingsRequest request, Integer updatedByUserId) {
        if (updatedByUserId == null) {
            throw new IllegalArgumentException("A valid logged-in user is required to update threshold settings.");
        }

        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new IllegalArgumentException("Current password is required before saving threshold settings.");
        }

        if (!isCurrentPasswordValid(updatedByUserId, request.getCurrentPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }

        ThresholdSettingsResponse current = getThresholdSettings();

        return jdbcTemplate.queryForObject(
                "CALL sp_save_threshold_settings(?, ?, ?, ?, ?, ?, ?, ?)",
                (rs, rowNum) -> new ThresholdSettingsResponse(
                        rs.getBigDecimal("moisture_min"),
                        rs.getBigDecimal("gas_max"),
                        rs.getInt("reading_interval_seconds"),
                        rs.getInt("spray_duration_seconds"),
                        rs.getInt("fan_duration_seconds"),
                        rs.getInt("spray_cooldown_seconds"),
                        rs.getInt("fan_cooldown_seconds"),
                        rs.getObject("updated_by", Integer.class),
                        rs.getTimestamp("updated_at")
                ),
                valueOrDefault(request.getMoistureMin(), current.getMoistureMin()),
                valueOrDefault(request.getGasMax(), current.getGasMax()),
                valueOrDefault(request.getReadingIntervalSeconds(), current.getReadingIntervalSeconds()),
                valueOrDefault(request.getSprayDurationSeconds(), current.getSprayDurationSeconds()),
                valueOrDefault(request.getFanDurationSeconds(), current.getFanDurationSeconds()),
                valueOrDefault(request.getSprayCooldownSeconds(), current.getSprayCooldownSeconds()),
                valueOrDefault(request.getFanCooldownSeconds(), current.getFanCooldownSeconds()),
                updatedByUserId
        );
    }

    private boolean isCurrentPasswordValid(Integer userId, String currentPassword) {
        Integer passwordValid = jdbcTemplate.queryForObject(
                "CALL sp_verify_user_password(?, ?)",
                Integer.class,
                userId,
                currentPassword
        );

        return passwordValid != null && passwordValid == 1;
    }

    private ThresholdSettingsResponse defaultThresholdSettings() {
        return new ThresholdSettingsResponse(
                new BigDecimal("50"),
                new BigDecimal("1200"),
                30,
                5,
                5,
                30,
                30,
                null,
                null
        );
    }

    private BigDecimal valueOrDefault(BigDecimal value, BigDecimal fallback) {
        return value != null ? value : fallback;
    }

    private Integer valueOrDefault(Integer value, Integer fallback) {
        return value != null ? value : fallback;
    }
}
