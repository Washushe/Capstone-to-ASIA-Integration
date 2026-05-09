package com.group11.compostsystem.controller;

import com.group11.compostsystem.dto.SensorReadingRequest;
import com.group11.compostsystem.dto.SensorReadingResponse;
import com.group11.compostsystem.dto.ThresholdSettingsRequest;
import com.group11.compostsystem.dto.ThresholdSettingsResponse;
import com.group11.compostsystem.service.SensorReadingService;
import com.group11.compostsystem.service.ThresholdService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://127.0.0.1:5173"
})
public class SystemController {

    private final ThresholdService thresholdService;
    private final SensorReadingService sensorReadingService;

    public SystemController(ThresholdService thresholdService, SensorReadingService sensorReadingService) {
        this.thresholdService = thresholdService;
        this.sensorReadingService = sensorReadingService;
    }

    @GetMapping("/settings/thresholds")
    public ResponseEntity<ThresholdSettingsResponse> getThresholds() {
        return ResponseEntity.ok(thresholdService.getThresholdSettings());
    }

    @PutMapping("/settings/thresholds")
    public ResponseEntity<ThresholdSettingsResponse> saveThresholds(@RequestBody ThresholdSettingsRequest request) {
        return ResponseEntity.ok(thresholdService.saveThresholdSettings(request));
    }

    @PostMapping("/sensor-readings")
    public ResponseEntity<SensorReadingResponse> saveSensorReading(@RequestBody SensorReadingRequest request) {
        return ResponseEntity.ok(sensorReadingService.saveSensorReading(request));
    }

    @GetMapping("/sensor-readings/latest")
    public ResponseEntity<SensorReadingResponse> getLatestReading() {
        return ResponseEntity.ok(sensorReadingService.getLatestSensorReading());
    }

    @GetMapping("/sensor-readings")
    public ResponseEntity<java.util.List<SensorReadingResponse>> getAllReadings() {
        return ResponseEntity.ok(sensorReadingService.getAllSensorReadings());
    }
}
