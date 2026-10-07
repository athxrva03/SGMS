# Environmental Stress & Comfort Analysis

## 1. Concept
Sensors (Temperature, Humidity, Light, Soil Moisture) provide raw data, but they don't directly measure plant health. This analysis module translates raw data into a **"Quality of Life"** metric for the plants.

*   **Comfort**: The state when *all* environmental parameters are within their optimal ranges.
*   **Stress**: The state when *one or more* parameters deviate from the optimal range, potentially hindering growth or causing damage.

## 2. Key Metrics

### A. Comfort Time
The total duration (in hours/minutes) during a 24-hour period where the plant is in a "perfect" environment.
*   **Formula**:
    $$ \text{Comfort Time} = \sum \text{Time where } (T_{min} \le T \le T_{max}) \land (H_{min} \le H \le H_{max}) \land \dots $$

### B. Stress Time
The duration where the plant is fighting against adverse conditions.
*   **Formula**:
    $$ \text{Stress Time} = \text{Total Time} - \text{Comfort Time} $$

## 3. Analysis Methods

The system evaluates stress using three dimensions:

1.  **Frequency & Duration**: How often does stress occur, and for how long? (e.g., "2 hours of heat stress every afternoon").
2.  **Rate of Change**: How quickly do conditions deteriorate? Rapid changes (thermal shock) are more damaging than gradual ones.
3.  **Actuator Response**: Did the fan/pump/light turn on? Did it successfully mitigate the stress?

## 4. Analysis Outputs

### A. Comfort vs. Stress Timeline (Diagram)

This ASCII diagram visualizes a 24-hour day, distinguishing between comfortable periods and specific stress events.

```text
Status
  ^
  | [COMFORT]           [HEAT STRESS]           [COMFORT]      [DRY SOIL]
  |  (Ideal)             (Temp > 35C)            (Ideal)      (Moisture < 30%)
  |
  |++++++++++++++-------------------------++++++++++++++++++++----------------
  |
  +--------------------------------------------------------------------------> Time
  08:00          12:00                   15:00                18:00
```

### B. Stress Summary Table

| Parameter | Ideal Range | Current Status | Stress Duration (Last 24h) | Actuator Action |
| :--- | :--- | :--- | :--- | :--- |
| **Temperature** | 15°C - 35°C | 38°C (High) | 3 hrs 15 min | Fan: **ON** (Cooling) |
| **Humidity** | 40% - 80% | 45% (OK) | 0 min | Misting: OFF |
| **Soil Moisture** | 30% - 70% | 28% (Low) | 45 min | Pump: **ON** (Watering) |
| **Light** | 20% - 100% | 10% (Low) | 1 hr 20 min | Grow Light: **ON** |

### C. Predictive Improvements
*   **Pre-emptive Cooling**: Turn on fans *before* temperature hits the critical limit based on the rate of rise.
*   **Smart Watering**: Delay watering if humidity is very high (to prevent mold) or if rain is predicted (if connected to weather API).
*   **Stress Accumulation**: Calculate a "Daily Stress Index" score (0-100) to track long-term plant health trends.
