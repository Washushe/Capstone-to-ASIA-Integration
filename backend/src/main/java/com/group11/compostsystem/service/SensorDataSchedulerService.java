package com.group11.compostsystem.service;

import com.group11.compostsystem.dto.SensorReadingRequest;
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

    @Scheduled(fixedRate = 30000)
    public void generateAndStoreSensorData() {
        try {
            var thresholds = thresholdService.getThresholdSettings();
            var latestReading = sensorReadingService.getLatestSensorReading();

            SensorReadingRequest readingRequest = sensorSimulationService.generateMockSensorReading(
                    latestReading,
                    thresholds
            );

            sensorReadingService.saveSensorReading(readingRequest);
        } catch (Exception e) {
            System.err.println("Error generating sensor data: " + e.getMessage());
        }
    }
}
