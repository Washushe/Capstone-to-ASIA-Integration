package com.group11.compostsystem.controller;

import com.group11.compostsystem.dto.AIPredictionRequest;
import com.group11.compostsystem.dto.AIPredictionResponse;
import com.group11.compostsystem.service.PredictionService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/predictions")
@CrossOrigin(origins = "http://localhost:5173")
public class PredictionController {

    private final PredictionService predictionService;

    public PredictionController(PredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @GetMapping("/test")
    public String testPredictionController() {
        return "Prediction controller is working.";
    }

    @PostMapping("/generate")
    public AIPredictionResponse generatePrediction(@RequestBody AIPredictionRequest request) {
        return predictionService.generatePrediction(
                request.getBatchId(),
                request.getDaysWindow()
        );
    }

    @PostMapping("/generate/{batchId}")
    public AIPredictionResponse generatePredictionByBatchId(
            @PathVariable Integer batchId,
            @RequestBody(required = false) AIPredictionRequest request
    ) {
        Integer daysWindow = request == null ? 21 : request.getDaysWindow();
        return predictionService.generatePrediction(batchId, daysWindow);
    }
}