package com.example.sgms.service;

import com.example.sgms.dto.SensorDataRequest;
import com.example.sgms.entity.SensorReading;
import com.example.sgms.repository.SensorReadingRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class SensorService {

    private final SensorReadingRepository repository;

    public SensorService(SensorReadingRepository repository) {
        this.repository = repository;
    }

    public SensorReading insertData(SensorDataRequest request) {
        SensorReading reading = new SensorReading();
        reading.setTemperature(request.getTemperature());
        reading.setHumidity(request.getHumidity());
        reading.setSoilMoisture(request.getSoil_moisture());
        reading.setLightIntensity(request.getLight_intensity());
        return repository.save(reading);
    }

    public List<SensorReading> getLatestData(int limit) {
        return repository.findLatestReadings(limit);
    }

    public List<SensorReading> getHistoryData(int limit) {
        List<SensorReading> readings = repository.findLatestReadings(limit);
        Collections.reverse(readings);
        return readings;
    }
}
