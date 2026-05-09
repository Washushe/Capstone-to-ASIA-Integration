package com.group11.compostsystem.service;

import com.group11.compostsystem.dto.AIPredictionRequest;
import com.group11.compostsystem.dto.AIPredictionResponse;
import com.group11.compostsystem.dto.SensorReadingResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PredictionService {

    private final SensorReadingService sensorReadingService;

    public PredictionService(SensorReadingService sensorReadingService) {
        this.sensorReadingService = sensorReadingService;
    }

    public AIPredictionResponse generatePrediction(AIPredictionRequest request) {
        List<SensorReadingResponse> allReadings = sensorReadingService.getAllSensorReadings();
        if (allReadings == null || allReadings.isEmpty()) {
            return new AIPredictionResponse(Collections.singletonList(
                    "No historical sensor readings are available yet. Please wait for the system to collect data."
            ));
        }

        int lookback = request.getLookback() != null ? request.getLookback() : 20;
        List<SensorReadingResponse> history = allReadings.stream()
                .limit(lookback)
                .collect(Collectors.toList());

        Collections.reverse(history);

        List<String> sensors = request.getSensors();
        if (sensors == null || sensors.isEmpty()) {
            sensors = List.of("temperature", "moisture", "gas", "humidity");
        }

        Map<String, Double> averages = computeAverages(history);
        List<String> insights = new ArrayList<>();

        insights.add("AI forecast based on the latest sensor history:");

        if (sensors.contains("temperature")) {
            insights.add(buildTemperatureInsight(averages.get("temperature")));
        }
        if (sensors.contains("moisture")) {
            insights.add(buildMoistureInsight(averages.get("moisture")));
        }
        if (sensors.contains("gas")) {
            insights.add(buildGasInsight(averages.get("gas")));
        }
        if (sensors.contains("humidity")) {
            insights.add(buildHumidityInsight(averages.get("humidity")));
        }

        insights.add("Monitor the selected lines on the chart to see how each parameter is trending.");
        insights.add("For Gemini integration, replace this service with a real model call using the same sensor history payload.");

        return new AIPredictionResponse(insights);
    }

    private Map<String, Double> computeAverages(List<SensorReadingResponse> history) {
        double temperatureAverage = history.stream()
                .map(SensorReadingResponse::getTemperatureC)
                .filter(value -> value != null)
                .mapToDouble(BigDecimal::doubleValue)
                .average()
                .orElse(0.0);

        double moistureAverage = history.stream()
                .map(SensorReadingResponse::getMoistureLevel)
                .filter(value -> value != null)
                .mapToDouble(BigDecimal::doubleValue)
                .average()
                .orElse(0.0);

        double gasAverage = history.stream()
                .map(SensorReadingResponse::getGasLevel)
                .filter(value -> value != null)
                .mapToDouble(BigDecimal::doubleValue)
                .average()
                .orElse(0.0);

        double humidityAverage = history.stream()
                .map(SensorReadingResponse::getHumidityLevel)
                .filter(value -> value != null)
                .mapToDouble(BigDecimal::doubleValue)
                .average()
                .orElse(0.0);

        return Map.of(
                "temperature", temperatureAverage,
                "moisture", moistureAverage,
                "gas", gasAverage,
                "humidity", humidityAverage
        );
    }

    private String buildTemperatureInsight(double average) {
        if (average >= 31) {
            return "Temperature is trending high across the measured period; recommend improving ventilation to avoid overheating.";
        }
        if (average <= 24) {
            return "Temperature is cooler than ideal; the compost may need more active heat generation for faster decomposition.";
        }
        return "Temperature is stable in a good range for compost activity.";
    }

    private String buildMoistureInsight(double average) {
        if (average <= 45) {
            return "Moisture is below ideal levels; the system may need additional dampening soon.";
        }
        if (average >= 70) {
            return "Moisture is quite high; watch for potential saturation and reduce irrigation.";
        }
        return "Moisture levels are healthy for active composting.";
    }

    private String buildGasInsight(double average) {
        if (average >= 1200) {
            return "Gas concentration is elevated; improving airflow should reduce buildup and improve conditions.";
        }
        return "Gas levels are within acceptable bounds for current compost activity.";
    }

    private String buildHumidityInsight(double average) {
        if (average >= 70) {
            return "Humidity is high, meaning the environment is retaining moisture well.";
        }
        if (average <= 45) {
            return "Humidity is low; add moisture or reduce ventilation to avoid drying the compost.";
        }
        return "Humidity is balanced and supporting stable conditions.";
    }
}
