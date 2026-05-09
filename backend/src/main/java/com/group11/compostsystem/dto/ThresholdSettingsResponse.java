package com.group11.compostsystem.dto;

import java.math.BigDecimal;
import java.sql.Timestamp;

public class ThresholdSettingsResponse {

    private BigDecimal moistureMin;
    private BigDecimal gasMax;
    private Integer updatedBy;
    private Timestamp updatedAt;

    public ThresholdSettingsResponse(BigDecimal moistureMin, BigDecimal gasMax, Integer updatedBy, Timestamp updatedAt) {
        this.moistureMin = moistureMin;
        this.gasMax = gasMax;
        this.updatedBy = updatedBy;
        this.updatedAt = updatedAt;
    }

    public BigDecimal getMoistureMin() {
        return moistureMin;
    }

    public BigDecimal getGasMax() {
        return gasMax;
    }

    public Integer getUpdatedBy() {
        return updatedBy;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }
}
