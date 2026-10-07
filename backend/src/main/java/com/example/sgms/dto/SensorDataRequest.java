package com.example.sgms.dto;

import lombok.Data;

@Data
public class SensorDataRequest {
    private Float temperature;
    private Float humidity;
    private Float soil_moisture;
    private Float light_intensity;
}
