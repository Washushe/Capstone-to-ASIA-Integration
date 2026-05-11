package com.group11.compostsystem.dto;

public class SensorData {
    private String id;
    private String name;
    private Double value;
    private String unit;
    private Boolean actuatorActive;
    private String actuatorName;

    public SensorData() {}

    public SensorData(String id, String name, Double value, String unit, Boolean actuatorActive, String actuatorName) {
        this.id = id;
        this.name = name;
        this.value = value;
        this.unit = unit;
        this.actuatorActive = actuatorActive;
        this.actuatorName = actuatorName;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getValue() { return value; }
    public void setValue(Double value) { this.value = value; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Boolean getActuatorActive() { return actuatorActive; }
    public void setActuatorActive(Boolean actuatorActive) { this.actuatorActive = actuatorActive; }

    public String getActuatorName() { return actuatorName; }
    public void setActuatorName(String actuatorName) { this.actuatorName = actuatorName; }
}