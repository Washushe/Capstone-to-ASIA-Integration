package com.group11.compostsystem.dto;

public class CompostBatchRequest {
    private String batchName;
    private String primaryMaterial;
    private String materialDescription;
    private String startDate;
    private Integer expectedDurationDays;
    private String binLocation;
    private String notes;

    public String getBatchName() {
        return batchName;
    }

    public void setBatchName(String batchName) {
        this.batchName = batchName;
    }

    public String getPrimaryMaterial() {
        return primaryMaterial;
    }

    public void setPrimaryMaterial(String primaryMaterial) {
        this.primaryMaterial = primaryMaterial;
    }

    public String getMaterialDescription() {
        return materialDescription;
    }

    public void setMaterialDescription(String materialDescription) {
        this.materialDescription = materialDescription;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public Integer getExpectedDurationDays() {
        return expectedDurationDays;
    }

    public void setExpectedDurationDays(Integer expectedDurationDays) {
        this.expectedDurationDays = expectedDurationDays;
    }

    public String getBinLocation() {
        return binLocation;
    }

    public void setBinLocation(String binLocation) {
        this.binLocation = binLocation;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
