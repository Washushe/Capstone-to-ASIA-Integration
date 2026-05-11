package com.group11.compostsystem.controller;

import com.group11.compostsystem.dto.ActuatorStatusResponse;
import com.group11.compostsystem.dto.SensorData;
import com.group11.compostsystem.dto.SensorReadingResponse;
import com.group11.compostsystem.dto.SensorSimulationRequest;
import com.group11.compostsystem.dto.SensorSimulationResponse;
import com.group11.compostsystem.service.SensorReadingService;
import com.group11.compostsystem.service.SensorSimulationService;
import com.group11.compostsystem.service.ThresholdService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://127.0.0.1:5173"
})
public class SensorController {

    private final SensorSimulationService sensorSimulationService;
    private final SensorReadingService sensorReadingService;
    private final ThresholdService thresholdService;

    public SensorController(SensorSimulationService sensorSimulationService,
                           SensorReadingService sensorReadingService,
                           ThresholdService thresholdService) {
        this.sensorSimulationService = sensorSimulationService;
        this.sensorReadingService = sensorReadingService;
        this.thresholdService = thresholdService;
    }

    @PostMapping("/sensor-simulation")
    public ResponseEntity<SensorSimulationResponse> simulateSensorData(@RequestBody SensorSimulationRequest request) {
        SensorSimulationResponse response = sensorSimulationService.simulateNextReading(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/actuator-status")
    public ResponseEntity<ActuatorStatusResponse> getActuatorStatus() {
        try {
            // Get current thresholds
            var thresholds = thresholdService.getThresholdSettings();

            // Get latest sensor reading
            SensorReadingResponse latestReading = sensorReadingService.getLatestSensorReading();

            if (latestReading != null) {
                // Convert to sensor data format
                List<SensorData> sensorDataList = Arrays.asList(
                    new SensorData("temperature", "Temperature", latestReading.getTemperatureC().doubleValue(), "°C", false, null),
                    new SensorData("moisture", "Moisture", latestReading.getMoistureLevel().doubleValue(), "%", false, null),
                    new SensorData("gas", "Gas Concentration", latestReading.getGasLevel().doubleValue(), "PPM", false, null),
                    new SensorData("humidity", "Humidity", latestReading.getHumidityLevel().doubleValue(), "%", false, null)
                );

                // Determine actuator status based on current readings
                boolean fanActive = sensorDataList.stream().anyMatch(sensor ->
                    (sensor.getId().equals("gas") && sensor.getValue() > 1200.0) ||
                    (sensor.getId().equals("temperature") && sensor.getValue() > 35.0)
                );

                boolean waterPumpActive = sensorDataList.stream().anyMatch(sensor ->
                    sensor.getId().equals("moisture") && sensor.getValue() < thresholds.getMoistureMin().doubleValue()
                );

                return ResponseEntity.ok(new ActuatorStatusResponse(fanActive, waterPumpActive));
            } else {
                // No readings yet, actuators inactive
                return ResponseEntity.ok(new ActuatorStatusResponse(false, false));
            }
        } catch (Exception e) {
            // If there's an error getting readings, assume actuators are inactive
            return ResponseEntity.ok(new ActuatorStatusResponse(false, false));
        }
    }
}