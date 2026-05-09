package com.group11.compostsystem.controller;

import com.group11.compostsystem.dto.AIPredictionRequest;
import com.group11.compostsystem.dto.AIPredictionResponse;
import com.group11.compostsystem.service.PredictionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://127.0.0.1:5173"
})
public class AIController {

    private final PredictionService predictionService;

    public AIController(PredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @PostMapping("/predict")
    public ResponseEntity<AIPredictionResponse> generatePrediction(@RequestBody AIPredictionRequest request) {
        return ResponseEntity.ok(predictionService.generatePrediction(request));
    }
}
