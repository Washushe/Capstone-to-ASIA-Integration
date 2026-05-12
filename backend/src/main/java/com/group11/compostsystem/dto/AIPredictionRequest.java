package com.group11.compostsystem.dto;

public class AIPredictionRequest {

    private Integer batchId;
    private Integer daysWindow;

    public AIPredictionRequest() {
    }

    public AIPredictionRequest(Integer batchId, Integer daysWindow) {
        this.batchId = batchId;
        this.daysWindow = daysWindow;
    }

    public Integer getBatchId() {
        return batchId;
    }

    public void setBatchId(Integer batchId) {
        this.batchId = batchId;
    }

    public Integer getDaysWindow() {
        return daysWindow;
    }

    public void setDaysWindow(Integer daysWindow) {
        this.daysWindow = daysWindow;
    }
}