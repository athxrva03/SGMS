package com.example.sgms.repository;

import com.example.sgms.entity.SensorReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {

    @Query(value = "SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT :limit", nativeQuery = true)
    List<SensorReading> findLatestReadings(int limit);
}
