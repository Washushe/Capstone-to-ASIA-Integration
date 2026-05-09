package com.group11.compostsystem.dto;

import java.math.BigDecimal;

public class SensorReadingRequest {

    private BigDecimal moistureLevel;
    private BigDecimal gasLevel;
    private BigDecimal temperatureC;
    private BigDecimal humidityLevel;

    public BigDecimal getMoistureLevel() {
        return moistureLevel;
    }

    public void setMoistureLevel(BigDecimal moistureLevel) {
        this.moistureLevel = moistureLevel;
    }

    public BigDecimal getGasLevel() {
        return gasLevel;
    }

    public void setGasLevel(BigDecimal gasLevel) {
        this.gasLevel = gasLevel;
    }

    public BigDecimal getTemperatureC() {
        return temperatureC;
    }

    public void setTemperatureC(BigDecimal temperatureC) {
        this.temperatureC = temperatureC;
    }

    public BigDecimal getHumidityLevel() {
        return humidityLevel;
    }

    public void setHumidityLevel(BigDecimal humidityLevel) {
        this.humidityLevel = humidityLevel;
    }
}
