package com.group11.compostsystem.controller;

import com.group11.compostsystem.dto.SensorReadingRequest;
import com.group11.compostsystem.dto.SensorReadingResponse;
import com.group11.compostsystem.service.SensorReadingService;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sensor-readings")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://127.0.0.1:5173"
})
public class SensorReadingsController {

    private final SensorReadingService sensorReadingService;

    public SensorReadingsController(SensorReadingService sensorReadingService) {
        this.sensorReadingService = sensorReadingService;
    }

    @PostMapping
    public ResponseEntity<SensorReadingResponse> saveSensorReading(@RequestBody SensorReadingRequest request) {
        SensorReadingResponse response = sensorReadingService.saveSensorReading(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/latest")
    public ResponseEntity<SensorReadingResponse> getLatestSensorReading() {
        try {
            SensorReadingResponse response = sensorReadingService.getLatestSensorReading();
            return ResponseEntity.ok(response);
        } catch (EmptyResultDataAccessException e) {
            return ResponseEntity.noContent().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<SensorReadingResponse>> getSensorReadings() {
        List<SensorReadingResponse> response = sensorReadingService.getAllSensorReadings();
        return ResponseEntity.ok(response);
    }
}