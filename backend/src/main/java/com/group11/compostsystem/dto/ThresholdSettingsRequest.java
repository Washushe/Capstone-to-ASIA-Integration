package com.group11.compostsystem.dto;

import java.math.BigDecimal;

public class ThresholdSettingsRequest {

    private BigDecimal moistureMin;
    private BigDecimal gasMax;

    public BigDecimal getMoistureMin() {
        return moistureMin;
    }

    public void setMoistureMin(BigDecimal moistureMin) {
        this.moistureMin = moistureMin;
    }

    public BigDecimal getGasMax() {
        return gasMax;
    }

    public void setGasMax(BigDecimal gasMax) {
        this.gasMax = gasMax;
    }
}
