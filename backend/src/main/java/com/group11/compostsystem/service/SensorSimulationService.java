package com.group11.compostsystem.service;

import com.group11.compostsystem.dto.SensorData;
import com.group11.compostsystem.dto.SensorReadingRequest;
import com.group11.compostsystem.dto.SensorReadingResponse;
import com.group11.compostsystem.dto.SensorSimulationRequest;
import com.group11.compostsystem.dto.SensorSimulationResponse;
import com.group11.compostsystem.dto.ThresholdSettingsResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class SensorSimulationService {

    private static final double MOISTURE_MIN = 35.0;
    private static final double MOISTURE_MAX = 80.0;
    private static final double GAS_MIN = 700.0;
    private static final double GAS_MAX = 1600.0;
    private static final double TEMPERATURE_MIN = 28.0;
    private static final double TEMPERATURE_MAX = 45.0;
    private static final double HUMIDITY_MIN = 40.0;
    private static final double HUMIDITY_MAX = 75.0;

    private static final double MOISTURE_TRIGGER_CHANCE = 0.30;
    private static final double GAS_TRIGGER_CHANCE = 0.30;

    private static final List<SensorData> SENSOR_LAYOUT = Arrays.asList(
            new SensorData("temperature", "Temperature", 35.0, "°C", false, null),
            new SensorData("moisture", "Moisture", 60.0, "%", false, null),
            new SensorData("gas", "Gas Level", 1000.0, "index", false, null),
            new SensorData("humidity", "Humidity", 55.0, "%", false, null)
    );

    private final Random random = new Random();

    public SensorSimulationResponse simulateNextReading(SensorSimulationRequest request) {
        int moistureMin = request.getMoistureMin() != null ? request.getMoistureMin() : 50;
        int gasMax = request.getGasMax() != null ? request.getGasMax() : 1200;

        List<SensorData> sensors = SENSOR_LAYOUT.stream()
                .map(sensor -> {
                    double value = generateValue(sensor.getId(), moistureMin, gasMax);
                    boolean actuatorActive = isActuatorActive(sensor.getId(), value, moistureMin, gasMax);
                    String actuatorName = getActuatorName(sensor.getId(), actuatorActive);

                    return new SensorData(
                            sensor.getId(),
                            sensor.getName(),
                            value,
                            sensor.getUnit(),
                            actuatorActive,
                            actuatorName
                    );
                })
                .collect(Collectors.toList());

        return new SensorSimulationResponse(sensors);
    }

    public SensorReadingRequest generateMockSensorReading(SensorReadingResponse latestReading,
                                                         ThresholdSettingsResponse thresholds) {
        SensorSimulationRequest simulationRequest = new SensorSimulationRequest();
        simulationRequest.setMoistureMin(thresholds.getMoistureMin().intValue());
        simulationRequest.setGasMax(thresholds.getGasMax().intValue());

        SensorSimulationResponse simulation = simulateNextReading(simulationRequest);
        SensorReadingRequest readingRequest = new SensorReadingRequest();

        if (latestReading != null && latestReading.getBatchId() != null) {
            readingRequest.setBatchId(latestReading.getBatchId());
        }

        for (SensorData sensor : simulation.getSensors()) {
            BigDecimal value = BigDecimal.valueOf(sensor.getValue());

            switch (sensor.getId()) {
                case "temperature" -> readingRequest.setTemperatureC(value);
                case "moisture" -> readingRequest.setMoistureLevel(value);
                case "gas" -> readingRequest.setGasLevel(value);
                case "humidity" -> readingRequest.setHumidityLevel(value);
                default -> {
                }
            }
        }

        return readingRequest;
    }

    private double generateValue(String sensorId, int moistureMin, int gasMax) {
        double value;

        switch (sensorId) {
            case "moisture" -> {
                boolean trigger = random.nextDouble() < MOISTURE_TRIGGER_CHANCE;
                double highEnd = Math.max(MOISTURE_MIN, Math.min(moistureMin - 0.1, 49.9));
                value = trigger
                        ? randomBetween(MOISTURE_MIN, highEnd)
                        : randomBetween(Math.max(50.0, moistureMin), MOISTURE_MAX);
            }
            case "gas" -> {
                boolean trigger = random.nextDouble() < GAS_TRIGGER_CHANCE;
                value = trigger
                        ? randomBetween(Math.max(1200.1, gasMax + 0.1), GAS_MAX)
                        : randomBetween(GAS_MIN, Math.min(1200.0, gasMax));
            }
            case "temperature" -> value = randomBetween(TEMPERATURE_MIN, TEMPERATURE_MAX);
            case "humidity" -> value = randomBetween(HUMIDITY_MIN, HUMIDITY_MAX);
            default -> value = 0.0;
        }

        return Math.round(value * 10.0) / 10.0;
    }

    private boolean isActuatorActive(String sensorId, double value, int moistureMin, int gasMax) {
        if ("moisture".equals(sensorId)) {
            return value < moistureMin;
        }

        if ("gas".equals(sensorId)) {
            return value > gasMax;
        }

        return false;
    }

    private String getActuatorName(String sensorId, boolean actuatorActive) {
        if (!actuatorActive) {
            return null;
        }

        if ("moisture".equals(sensorId)) {
            return "Water Spray";
        }

        if ("gas".equals(sensorId)) {
            return "Fan";
        }

        return null;
    }

    private double randomBetween(double min, double max) {
        if (max <= min) {
            return min;
        }

        return min + (random.nextDouble() * (max - min));
    }
}
