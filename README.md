# Smart Greenhouse Monitoring System (SGMS)

## Description
A full-stack application that monitors greenhouse sensors (Temperature, Humidity, Soil Moisture, Light Intensity) and visualizes the data on a web dashboard. It features live charts, data history, and PDF report generation.

## Tech Stack
* Java
* Spring Boot
* Spring REST API
* Spring Data JPA
* Hibernate
* MySQL
* HTML
* CSS
* JavaScript

## Architecture
```text
Frontend
   ↓
Spring Boot REST API
   ↓
MySQL
```

## Local Setup
1. Clone repository
2. Configure MySQL
3. Configure environment variables (DB_URL, DB_USERNAME, DB_PASSWORD, PORT)
4. Run Spring Boot (`./mvnw spring-boot:run` or build the jar)
5. Open `http://localhost:8080/`
