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
                    "SELECT moisture_min, gas_max, updated_by, updated_at FROM threshold_settings ORDER BY setting_id DESC LIMIT 1",
                    (rs, rowNum) -> new ThresholdSettingsResponse(
                            rs.getBigDecimal("moisture_min"),
                            rs.getBigDecimal("gas_max"),
                            rs.getObject("updated_by", Integer.class),
                            rs.getTimestamp("updated_at")
                    )
            );
        } catch (EmptyResultDataAccessException ex) {
            return new ThresholdSettingsResponse(new BigDecimal("50"), new BigDecimal("1200"), null, null);
        }
    }

    public ThresholdSettingsResponse saveThresholdSettings(ThresholdSettingsRequest request) {
        jdbcTemplate.update(
                "INSERT INTO threshold_settings (moisture_min, gas_max, updated_by) VALUES (?, ?, NULL)",
                request.getMoistureMin(), request.getGasMax()
        );

        return getThresholdSettings();
    }
}
