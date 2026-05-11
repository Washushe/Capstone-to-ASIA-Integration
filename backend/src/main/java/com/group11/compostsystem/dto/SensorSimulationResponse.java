package com.group11.compostsystem.dto;

import java.util.List;

public class SensorSimulationResponse {
    private List<SensorData> sensors;

    public SensorSimulationResponse() {}

    public SensorSimulationResponse(List<SensorData> sensors) {
        this.sensors = sensors;
    }

    public List<SensorData> getSensors() {
        return sensors;
    }

    public void setSensors(List<SensorData> sensors) {
        this.sensors = sensors;
    }
}