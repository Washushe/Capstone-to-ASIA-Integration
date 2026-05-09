package com.group11.compostsystem.dto;

import java.util.List;

public class AIPredictionRequest {
    private List<String> sensors;
    private Integer lookback;

    public List<String> getSensors() {
        return sensors;
    }

    public void setSensors(List<String> sensors) {
        this.sensors = sensors;
    }

    public Integer getLookback() {
        return lookback;
    }

    public void setLookback(Integer lookback) {
        this.lookback = lookback;
    }
}
