package com.group11.compostsystem.service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.group11.compostsystem.dto.AIPredictionResponse;

@Service
public class PredictionService {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    private static final Set<String> VALID_CONDITIONS = Set.of(
            "OPTIMAL",
            "TOO_DRY",
            "TOO_WET",
            "HIGH_GAS_LEVEL",
            "HIGH_TEMPERATURE",
            "LOW_TEMPERATURE",
            "HIGH_HUMIDITY",
            "LOW_HUMIDITY",
            "NEEDS_ATTENTION"
    );

    public PredictionService(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public AIPredictionResponse generatePrediction(Integer batchId, Integer daysWindow) {
        try {
            if (geminiApiKey == null || geminiApiKey.isBlank()) {
                return AIPredictionResponse.failed("Gemini API key is missing. Set GEMINI_API_KEY in Eclipse Run Configurations.");
            }

            int window = daysWindow == null || daysWindow <= 0 ? 21 : daysWindow;

            Map<String, Object> batch = getBatch(batchId);
            if (batch == null) {
                return AIPredictionResponse.failed("Compost batch not found.");
            }

            Map<String, Object> latestReading = getLatestReading(batchId);
            if (latestReading == null) {
                return AIPredictionResponse.failed("No sensor readings found for this compost batch.");
            }

            Map<String, Object> readingSummary = getReadingSummary(batchId, window);
            List<Map<String, Object>> actuatorSummary = getActuatorSummary(batchId, window);
            Map<String, Object> thresholds = getLatestThresholds();

            String inputSnapshot = objectMapper.writeValueAsString(Map.of(
                    "batch", batch,
                    "latestReading", latestReading,
                    "readingSummary", readingSummary,
                    "actuatorSummary", actuatorSummary,
                    "thresholds", thresholds,
                    "analysisWindowDays", window
            ));

            String prompt = buildPrompt(inputSnapshot);
            String rawGeminiResponse = callGemini(prompt);
            JsonNode aiJson = parseGeminiJson(rawGeminiResponse);

            String predictedCondition = getText(aiJson, "predicted_condition", "NEEDS_ATTENTION").toUpperCase();
            if (!VALID_CONDITIONS.contains(predictedCondition)) {
                predictedCondition = "NEEDS_ATTENTION";
            }

            String predictionSummary = getText(aiJson, "prediction_summary", "AI prediction summary was not available.");
            String recommendation = getText(aiJson, "recommendation", "Continue monitoring compost conditions.");
            String trendSummary = getText(aiJson, "trend_summary", "Trend summary was not available.");

            LocalDate estimatedReadyDate = getDate(aiJson, "estimated_ready_date");
            Integer estimatedDaysRemaining = getInteger(aiJson, "estimated_days_remaining");
            BigDecimal confidenceScore = getBigDecimal(aiJson, "confidence_score", new BigDecimal("0.70"));

            Integer readingId = ((Number) latestReading.get("reading_id")).intValue();

            Integer predictionId = savePrediction(
                    batchId,
                    readingId,
                    predictedCondition,
                    predictionSummary,
                    estimatedReadyDate,
                    estimatedDaysRemaining,
                    recommendation,
                    trendSummary,
                    readingSummary,
                    confidenceScore,
                    inputSnapshot,
                    rawGeminiResponse
            );

            if (estimatedReadyDate != null) {
                updateBatchLatestReadyDate(batchId, estimatedReadyDate);
            }

            return AIPredictionResponse.success(
                    "AI prediction generated successfully.",
                    predictionId,
                    batchId,
                    predictedCondition,
                    predictionSummary,
                    estimatedReadyDate,
                    estimatedDaysRemaining,
                    recommendation,
                    trendSummary,
                    confidenceScore
            );

        } catch (Exception e) {
            return AIPredictionResponse.failed("AI prediction failed: " + e.getMessage());
        }
    }

    private Map<String, Object> getBatch(Integer batchId) {
        List<Map<String, Object>> result = jdbcTemplate.queryForList(
                """
                SELECT batch_id, batch_code, batch_name, primary_material, material_description,
                       start_date, expected_duration_days, initial_estimated_ready_date,
                       latest_predicted_ready_date, actual_ready_date, status, bin_location, notes
                FROM compost_batches
                WHERE batch_id = ?
                """,
                batchId
        );

        return result.isEmpty() ? null : result.get(0);
    }

    private Map<String, Object> getLatestReading(Integer batchId) {
        List<Map<String, Object>> result = jdbcTemplate.queryForList(
                """
                SELECT reading_id, batch_id, moisture_level, gas_level, temperature_c,
                       temperature_status, humidity_level, humidity_status,
                       moisture_status, gas_status, created_at
                FROM sensor_readings
                WHERE batch_id = ?
                ORDER BY created_at DESC
                LIMIT 1
                """,
                batchId
        );

        return result.isEmpty() ? null : result.get(0);
    }

    private Map<String, Object> getReadingSummary(Integer batchId, int daysWindow) {
        LocalDateTime start = LocalDateTime.now().minusDays(daysWindow);

        return jdbcTemplate.queryForMap(
                """
                SELECT 
                    COUNT(*) AS total_readings,
                    MIN(created_at) AS analysis_window_start,
                    MAX(created_at) AS analysis_window_end,

                    AVG(moisture_level) AS avg_moisture,
                    MIN(moisture_level) AS min_moisture,
                    MAX(moisture_level) AS max_moisture,
                    SUM(CASE WHEN moisture_status = 'LOW' THEN 1 ELSE 0 END) AS low_moisture_count,
                    SUM(CASE WHEN moisture_status = 'HIGH' THEN 1 ELSE 0 END) AS high_moisture_count,

                    AVG(gas_level) AS avg_gas,
                    MIN(gas_level) AS min_gas,
                    MAX(gas_level) AS max_gas,
                    SUM(CASE WHEN gas_status = 'HIGH' THEN 1 ELSE 0 END) AS high_gas_count,

                    AVG(temperature_c) AS avg_temperature,
                    MIN(temperature_c) AS min_temperature,
                    MAX(temperature_c) AS max_temperature,
                    SUM(CASE WHEN temperature_status = 'LOW' THEN 1 ELSE 0 END) AS low_temperature_count,
                    SUM(CASE WHEN temperature_status = 'HIGH' THEN 1 ELSE 0 END) AS high_temperature_count,

                    AVG(humidity_level) AS avg_humidity,
                    MIN(humidity_level) AS min_humidity,
                    MAX(humidity_level) AS max_humidity,
                    SUM(CASE WHEN humidity_status = 'LOW' THEN 1 ELSE 0 END) AS low_humidity_count,
                    SUM(CASE WHEN humidity_status = 'HIGH' THEN 1 ELSE 0 END) AS high_humidity_count
                FROM sensor_readings
                WHERE batch_id = ?
                  AND created_at >= ?
                """,
                batchId,
                Timestamp.valueOf(start)
        );
    }

    private List<Map<String, Object>> getActuatorSummary(Integer batchId, int daysWindow) {
        LocalDateTime start = LocalDateTime.now().minusDays(daysWindow);

        return jdbcTemplate.queryForList(
                """
                SELECT actuator_type, status, trigger_source, COUNT(*) AS total_events
                FROM actuator_logs
                WHERE batch_id = ?
                  AND created_at >= ?
                GROUP BY actuator_type, status, trigger_source
                ORDER BY actuator_type, status, trigger_source
                """,
                batchId,
                Timestamp.valueOf(start)
        );
    }

    private Map<String, Object> getLatestThresholds() {
        List<Map<String, Object>> result = jdbcTemplate.queryForList(
                """
                SELECT
                    moisture_min,
                    gas_max,
                    reading_interval_seconds,
                    spray_duration_seconds,
                    fan_duration_seconds,
                    spray_cooldown_seconds,
                    fan_cooldown_seconds,
                    updated_at
                FROM threshold_settings
                ORDER BY updated_at DESC
                LIMIT 1
                """
        );

        return result.isEmpty() ? Map.of(
                "moisture_min", 50,
                "gas_max", 1200,
                "reading_interval_seconds", 30,
                "spray_duration_seconds", 5,
                "fan_duration_seconds", 5,
                "spray_cooldown_seconds", 30,
                "fan_cooldown_seconds", 30,
                "note", "Default fallback thresholds were used."
        ) : result.get(0);
    }

    private String buildPrompt(String inputSnapshot) {
        return """
        You are an AI assistant for an IoT-Based Compost Accelerator with AI Prediction, Monitoring, and Automated Spray and Fan Control.

        Analyze the compost batch using:
        - moisture sensor readings
        - gas sensor readings
        - temperature sensor readings
        - humidity sensor readings
        - water spray actuator logs
        - fan actuator logs
        - threshold settings
        - compost batch start date and material information

        The system uses moisture and gas thresholds to control actuators:
        - low moisture can trigger the water spray
        - high gas can trigger the fan
        Temperature and humidity are used mainly for prediction and condition analysis.

        Your task:
        Estimate the compost condition and predict the possible date when it may become ready for use as natural fertilizer.

        Return ONLY valid JSON using this structure:

        {
          "predicted_condition": "OPTIMAL | TOO_DRY | TOO_WET | HIGH_GAS_LEVEL | HIGH_TEMPERATURE | LOW_TEMPERATURE | HIGH_HUMIDITY | LOW_HUMIDITY | NEEDS_ATTENTION",
          "prediction_summary": "short explanation of the compost condition",
          "estimated_ready_date": "YYYY-MM-DD or null",
          "estimated_days_remaining": 0,
          "recommendation": "specific action recommendation",
          "trend_summary": "summary of sensor and actuator trends",
          "confidence_score": 0.80
        }

        Rules:
        - Do not invent sensor data.
        - Base the prediction only on the provided database snapshot.
        - If data is insufficient, say so in the summary and give a lower confidence score.
        - confidence_score must be between 0.00 and 1.00.
        - estimated_days_remaining must be a whole number or null.
        - estimated_ready_date must be a valid date or null.

        Database snapshot:
        """ + inputSnapshot;
    }

    private String callGemini(String prompt) throws Exception {
        String encodedModel = URLEncoder.encode(geminiModel, StandardCharsets.UTF_8);
        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/"
                + encodedModel
                + ":generateContent?key="
                + geminiApiKey;

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.2,
                        "responseMimeType", "application/json"
                )
        );

        String jsonBody = objectMapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpClient client = HttpClient.newHttpClient();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new RuntimeException("Gemini API error: HTTP " + response.statusCode() + " - " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());

        JsonNode textNode = root.path("candidates")
                .path(0)
                .path("content")
                .path("parts")
                .path(0)
                .path("text");

        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            throw new RuntimeException("Gemini returned an empty response.");
        }

        return textNode.asText();
    }

    private JsonNode parseGeminiJson(String rawGeminiResponse) throws Exception {
        String cleaned = rawGeminiResponse
                .replace("```json", "")
                .replace("```", "")
                .trim();

        return objectMapper.readTree(cleaned);
    }

    private Integer savePrediction(
            Integer batchId,
            Integer readingId,
            String predictedCondition,
            String predictionSummary,
            LocalDate estimatedReadyDate,
            Integer estimatedDaysRemaining,
            String recommendation,
            String trendSummary,
            Map<String, Object> readingSummary,
            BigDecimal confidenceScore,
            String inputSnapshot,
            String rawGeminiResponse
    ) {
        Timestamp windowStart = toTimestamp(readingSummary.get("analysis_window_start"));
        Timestamp windowEnd = toTimestamp(readingSummary.get("analysis_window_end"));

        String sql = """
            INSERT INTO ai_predictions (
                batch_id,
                prediction_type,
                reading_id,
                predicted_condition,
                prediction_summary,
                estimated_ready_date,
                estimated_days_remaining,
                recommendation,
                trend_summary,
                analysis_window_start,
                analysis_window_end,
                confidence_score,
                model_provider,
                model_name,
                input_snapshot,
                raw_ai_response
            )
            VALUES (?, 'READINESS_ESTIMATE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Gemini', ?, ?, ?)
            """;

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);

            ps.setObject(1, batchId);
            ps.setObject(2, readingId);
            ps.setString(3, predictedCondition);
            ps.setString(4, predictionSummary);

            if (estimatedReadyDate != null) {
                ps.setDate(5, Date.valueOf(estimatedReadyDate));
            } else {
                ps.setNull(5, java.sql.Types.DATE);
            }

            if (estimatedDaysRemaining != null) {
                ps.setInt(6, estimatedDaysRemaining);
            } else {
                ps.setNull(6, java.sql.Types.INTEGER);
            }

            ps.setString(7, recommendation);
            ps.setString(8, trendSummary);
            ps.setTimestamp(9, windowStart);
            ps.setTimestamp(10, windowEnd);
            ps.setBigDecimal(11, confidenceScore);
            ps.setString(12, geminiModel);
            ps.setString(13, inputSnapshot);
            ps.setString(14, rawGeminiResponse);

            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        return key == null ? null : key.intValue();
    }

    private void updateBatchLatestReadyDate(Integer batchId, LocalDate estimatedReadyDate) {
        jdbcTemplate.update(
                """
                UPDATE compost_batches
                SET latest_predicted_ready_date = ?
                WHERE batch_id = ?
                """,
                Date.valueOf(estimatedReadyDate),
                batchId
        );
    }

    private String getText(JsonNode node, String fieldName, String fallback) {
        JsonNode value = node.get(fieldName);
        if (value == null || value.isNull()) {
            return fallback;
        }
        return value.asText(fallback);
    }

    private Integer getInteger(JsonNode node, String fieldName) {
        JsonNode value = node.get(fieldName);
        if (value == null || value.isNull()) {
            return null;
        }
        return value.asInt();
    }

    private BigDecimal getBigDecimal(JsonNode node, String fieldName, BigDecimal fallback) {
        JsonNode value = node.get(fieldName);
        if (value == null || value.isNull()) {
            return fallback;
        }
        return value.decimalValue();
    }

    private LocalDate getDate(JsonNode node, String fieldName) {
        JsonNode value = node.get(fieldName);
        if (value == null || value.isNull() || value.asText().isBlank() || value.asText().equalsIgnoreCase("null")) {
            return null;
        }
        return LocalDate.parse(value.asText());
    }

    private Timestamp toTimestamp(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Timestamp timestamp) {
            return timestamp;
        }

        if (value instanceof LocalDateTime localDateTime) {
            return Timestamp.valueOf(localDateTime);
        }

        return Timestamp.valueOf(value.toString().replace("T", " "));
    }
}
