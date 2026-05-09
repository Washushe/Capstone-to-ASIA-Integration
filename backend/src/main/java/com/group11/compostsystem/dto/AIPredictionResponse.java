package com.group11.compostsystem.dto;

import java.util.List;

public class AIPredictionResponse {
    private List<String> insights;

    public AIPredictionResponse() {
    }

    public AIPredictionResponse(List<String> insights) {
        this.insights = insights;
    }

    public List<String> getInsights() {
        return insights;
    }

    public void setInsights(List<String> insights) {
        this.insights = insights;
    }
}
