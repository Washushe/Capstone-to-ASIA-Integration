package com.group11.compostsystem.service;

import com.group11.compostsystem.dto.SensorData;
import com.group11.compostsystem.dto.SensorSimulationRequest;
import com.group11.compostsystem.dto.SensorSimulationResponse;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SensorSimulationService {

    private static final List<SensorData> mockSensors = Arrays.asList(
        new SensorData("temperature", "Temperature", 28.5, "°C", false, null),
        new SensorData("moisture", "Moisture", 65.0, "%", false, null),
        new SensorData("gas", "Gas Concentration", 1200.0, "PPM", false, null),
        new SensorData("humidity", "Humidity", 55.0, "%", false, null)
    );

    public SensorSimulationResponse simulateNextReading(SensorSimulationRequest request) {
        List<SensorData> previousReadings = request.getLastReading() != null ? request.getLastReading() : mockSensors;
        int moistureMin = request.getMoistureMin() != null ? request.getMoistureMin() : 50;
        int gasMax = request.getGasMax() != null ? request.getGasMax() : 1200;

        Map<String, SensorData> previousMap = previousReadings.stream()
            .collect(Collectors.toMap(SensorData::getId, data -> data));

        boolean fanActive = isFanActive(previousReadings, gasMax);
        boolean pumpActive = isPumpActive(previousReadings, moistureMin);

        List<SensorData> nextSensors = mockSensors.stream().map(sensor -> {
            SensorData last = previousMap.get(sensor.getId());
            double value;

            if (last != null) {
                value = simulateSensorValue(
                        sensor.getId(),
                        last.getValue(),
                        fanActive,
                        pumpActive,
                        gasMax,
                        moistureMin
                );
            } else {
                value = sensor.getValue() + ((Math.random() - 0.5) * 2);
            }

            value = clamp(value, getMin(sensor.getId()), getMax(sensor.getId()));
            value = Math.round(value * 10.0) / 10.0;

            boolean actuatorActive = isActuatorActive(sensor.getId(), value, moistureMin, gasMax);
            String actuatorName = actuatorActive ? getActuatorName(sensor.getId(), value, moistureMin, gasMax) : null;

            return new SensorData(sensor.getId(), sensor.getName(), value, sensor.getUnit(), actuatorActive, actuatorName);
        }).collect(Collectors.toList());

        return new SensorSimulationResponse(nextSensors);
    }


    private double simulateSensorValue(String sensorId, double lastValue, boolean fanActive,
                                       boolean pumpActive, int gasMax, int moistureMin) {
        double noise = (Math.random() - 0.5) * 1.5;

        switch (sensorId) {
            case "gas":

                // If fan is active and gas is too high
                if (fanActive && lastValue > gasMax) {

                    // Gradually reduce gas
                    return lastValue - (20 + Math.random() * 15);

                }

                // If gas is dangerously high
                else if (lastValue > gasMax + 200) {

                    // Natural decrease
                    return lastValue - (10 + Math.random() * 10);

                }

                // If gas is too low
                else if (lastValue < 850) {

                    // Slowly recover upward
                    return lastValue + (15 + Math.random() * 20);

                }

                // Normal fluctuation zone
                else {

                    // Random movement
                    return lastValue + ((Math.random() - 0.5) * 80);

                }

            case "temperature":
                // Keep temperature in optimal range (25-35°C)
                if (fanActive && lastValue > 35) {
                    return lastValue - (2.5 + Math.random() * 2) + noise;
                } else if (lastValue > 35) {
                    return lastValue - (0.5 + Math.random() * 1) + noise;
                } else if (lastValue < 25) {
                    return lastValue + (Math.random() * 2) + noise;
                } else {
                    return lastValue + noise;
                }

            case "moisture":
                if (pumpActive && lastValue < moistureMin) {
                    // Increase to optimal range when pump is active
                    return moistureMin + 10 + ((Math.random() - 0.5) * 5);
                } else if (lastValue < moistureMin) {
                    // Continue increasing when low
                    return lastValue + (3 + Math.random() * 2) + noise;
                } else if (lastValue > 75) {
                    // Decrease when high
                    return lastValue - (Math.random() * 5) + noise;
                } else {
                    // Normal fluctuation in optimal range
                    return lastValue + ((Math.random() - 0.5) * 10) + noise;
                }

            case "humidity":
                // Keep humidity in optimal range (45-75%)
                if (fanActive) {
                    return lastValue - (0.5 + Math.random() * 1) + noise;
                } else if (lastValue > 75) {
                    return lastValue - (Math.random() * 2) + noise;
                } else if (lastValue < 45) {
                    return lastValue + (Math.random() * 2) + noise;
                } else {
                    return lastValue + noise;
                }

            default:
                return lastValue + noise;
        }
    }

    private boolean isFanActive(List<SensorData> readings, int gasMax) {
        return readings.stream().anyMatch(r ->
            (r.getId().equals("gas") && r.getValue() > gasMax) ||
            (r.getId().equals("temperature") && r.getValue() > 35)
        );
    }

    private boolean isPumpActive(List<SensorData> readings, int moistureMin) {
        return readings.stream().anyMatch(r ->
            r.getId().equals("moisture") && r.getValue() < moistureMin
        );
    }

    private boolean isActuatorActive(String id, double value, int moistureMin, int gasMax) {
        if (id.equals("gas") && value > gasMax) return true;
        if (id.equals("temperature") && value > 35) return true;
        if (id.equals("moisture") && value < moistureMin) return true;
        return false;
    }

    private String getActuatorName(String id, double value, int moistureMin, int gasMax) {
        if ((id.equals("gas") && value > gasMax) || (id.equals("temperature") && value > 35)) return "Fan";
        if (id.equals("moisture") && value < moistureMin) return "Water Pump";
        return null;
    }

    private double clamp(double value, double min, double max) {
        return Math.min(Math.max(value, min), max);
    }

    private double getMin(String id) {
        switch (id) {
            case "temperature": return 20;
            case "moisture": return 30;
            case "gas": return 850;
            case "humidity": return 35;
            default: return 0;
        }
    }

    private double getMax(String id) {
        switch (id) {
            case "temperature": return 45;
            case "moisture": return 85;
            case "gas": return 1800;
            case "humidity": return 85;
            default: return 100;
        }
    }
}