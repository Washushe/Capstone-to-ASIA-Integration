package com.group11.compostsystem.controller;

import com.group11.compostsystem.dto.ThresholdSettingsRequest;
import com.group11.compostsystem.dto.ThresholdSettingsResponse;
import com.group11.compostsystem.service.ThresholdService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://127.0.0.1:5173"
})
public class SettingsController {

    private final ThresholdService thresholdService;

    public SettingsController(ThresholdService thresholdService) {
        this.thresholdService = thresholdService;
    }

    @GetMapping("/thresholds")
    public ResponseEntity<ThresholdSettingsResponse> getThresholdSettings() {
        ThresholdSettingsResponse response = thresholdService.getThresholdSettings();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/thresholds")
    public ResponseEntity<ThresholdSettingsResponse> saveThresholdSettings(@RequestBody ThresholdSettingsRequest request) {
        ThresholdSettingsResponse response = thresholdService.saveThresholdSettings(request);
        return ResponseEntity.ok(response);
    }
}