package com.group11.compostsystem.service;

import com.group11.compostsystem.dto.SensorReadingRequest;
import com.group11.compostsystem.dto.SensorSimulationRequest;
import com.group11.compostsystem.dto.SensorSimulationResponse;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class SensorDataSchedulerService {

    private final SensorSimulationService sensorSimulationService;
    private final SensorReadingService sensorReadingService;
    private final ThresholdService thresholdService;

    public SensorDataSchedulerService(SensorSimulationService sensorSimulationService,
                                    SensorReadingService sensorReadingService,
                                    ThresholdService thresholdService) {
        this.sensorSimulationService = sensorSimulationService;
        this.sensorReadingService = sensorReadingService;
        this.thresholdService = thresholdService;
    }

    @Scheduled(fixedRate = 60000) // Run every 60 seconds
    public void generateAndStoreSensorData() {
        try {
            // Get current thresholds
            var thresholds = thresholdService.getThresholdSettings();

            // Get latest reading for simulation
            var latestReading = sensorReadingService.getLatestSensorReading();

            // Create simulation request
            SensorSimulationRequest request = new SensorSimulationRequest();
            request.setMoistureMin(thresholds.getMoistureMin().intValue());
            request.setGasMax(thresholds.getGasMax().intValue());

            // If we have a latest reading, use it for simulation
            if (latestReading != null && latestReading.getReadingId() != null) {
                // Convert latest reading to sensor data format for simulation
                var sensorData = java.util.Arrays.asList(
                    new com.group11.compostsystem.dto.SensorData("temperature", "Temperature",
                        latestReading.getTemperatureC().doubleValue(), "°C", false, null),
                    new com.group11.compostsystem.dto.SensorData("moisture", "Moisture",
                        latestReading.getMoistureLevel().doubleValue(), "%", false, null),
                    new com.group11.compostsystem.dto.SensorData("gas", "Gas Concentration",
                        latestReading.getGasLevel().doubleValue(), "PPM", false, null),
                    new com.group11.compostsystem.dto.SensorData("humidity", "Humidity",
                        latestReading.getHumidityLevel().doubleValue(), "%", false, null)
                );
                request.setLastReading(sensorData);
            }

            // Generate next simulation
            SensorSimulationResponse simulation = sensorSimulationService.simulateNextReading(request);

            // Store the simulated data
            SensorReadingRequest readingRequest = new SensorReadingRequest();
            var sensors = simulation.getSensors();
            for (var sensor : sensors) {
                switch (sensor.getId()) {
                    case "temperature":
                        readingRequest.setTemperatureC(java.math.BigDecimal.valueOf(sensor.getValue()));
                        break;
                    case "moisture":
                        readingRequest.setMoistureLevel(java.math.BigDecimal.valueOf(sensor.getValue()));
                        break;
                    case "gas":
                        readingRequest.setGasLevel(java.math.BigDecimal.valueOf(sensor.getValue()));
                        break;
                    case "humidity":
                        readingRequest.setHumidityLevel(java.math.BigDecimal.valueOf(sensor.getValue()));
                        break;
                }
            }

            sensorReadingService.saveSensorReading(readingRequest);

        } catch (Exception e) {
            // Log error but don't crash the application
            System.err.println("Error generating sensor data: " + e.getMessage());
        }
    }
}