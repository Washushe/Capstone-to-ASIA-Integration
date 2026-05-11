package com.group11.compostsystem.dto;

import java.util.List;

public class SensorSimulationRequest {
    private List<SensorData> lastReading;
    private Integer moistureMin;
    private Integer gasMax;

    public List<SensorData> getLastReading() {
        return lastReading;
    }

    public void setLastReading(List<SensorData> lastReading) {
        this.lastReading = lastReading;
    }

    public Integer getMoistureMin() {
        return moistureMin;
    }

    public void setMoistureMin(Integer moistureMin) {
        this.moistureMin = moistureMin;
    }

    public Integer getGasMax() {
        return gasMax;
    }

    public void setGasMax(Integer gasMax) {
        this.gasMax = gasMax;
    }
}