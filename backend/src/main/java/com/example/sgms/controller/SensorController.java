package com.example.sgms.controller;

import com.example.sgms.dto.MessageResponse;
import com.example.sgms.dto.SensorDataRequest;
import com.example.sgms.entity.SensorReading;
import com.example.sgms.service.SensorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class SensorController {

    private final SensorService sensorService;

    public SensorController(SensorService sensorService) {
        this.sensorService = sensorService;
    }

    @PostMapping("/data")
    public ResponseEntity<?> receiveData(@RequestBody SensorDataRequest request) {
        if (request.getTemperature() == null || request.getHumidity() == null) {
            throw new IllegalArgumentException("Missing required fields");
        }
        
        SensorReading saved = sensorService.insertData(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new MessageResponse("Data inserted successfully", saved.getId()));
    }

    @GetMapping("/data")
    public ResponseEntity<List<SensorReading>> getLatestData(
            @RequestParam(value = "limit", defaultValue = "1") int limit) {
        List<SensorReading> data = sensorService.getLatestData(limit);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/history")
    public ResponseEntity<List<SensorReading>> getHistory(
            @RequestParam(value = "limit", defaultValue = "20") int limit) {
        List<SensorReading> history = sensorService.getHistoryData(limit);
        return ResponseEntity.ok(history);
    }
}
