package com.group11.compostsystem.dto;

public class ActuatorStatusResponse {
    private boolean fanActive;
    private boolean waterPumpActive;

    public ActuatorStatusResponse() {}

    public ActuatorStatusResponse(boolean fanActive, boolean waterPumpActive) {
        this.fanActive = fanActive;
        this.waterPumpActive = waterPumpActive;
    }

    public boolean isFanActive() { return fanActive; }
    public void setFanActive(boolean fanActive) { this.fanActive = fanActive; }

    public boolean isWaterPumpActive() { return waterPumpActive; }
    public void setWaterPumpActive(boolean waterPumpActive) { this.waterPumpActive = waterPumpActive; }
}