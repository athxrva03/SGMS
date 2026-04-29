# Water Intake / Water Use Analysis

## 1. Concept
This module focuses on understanding the **plant–soil water dynamics**. It operates on the principle that soil moisture levels decrease over time due to:
1.  **Transpiration**: Plants absorbing water through roots and releasing it via leaves.
2.  **Evaporation**: Water loss directly from the soil surface.

By monitoring the **rate of decline** in soil moisture between irrigation cycles and correlating it with the **volume of water added** (via pump runtime), the system estimates the plant's water consumption and the efficiency of the irrigation strategy.

## 2. Method

The analysis relies on two key calculations:

### A. Water Delivered (Irrigation Event)
We calculate the total volume of water supplied during an active irrigation cycle.
*   **Formula**:
    $$ \text{Volume (L)} = \text{Pump Runtime (min)} \times \text{Flow Rate (L/min)} $$
*   **Input**:
    *   `Pump Status`: ON/OFF logs.
    *   `Flow Rate`: Constant (e.g., 1.0 L/min).

### B. Water Consumption (Depletion Rate)
We estimate how fast the soil dries out, which serves as a proxy for plant water use.
*   **Formula**:
    $$ \text{Depletion Rate (\%/hr)} = \frac{\text{Moisture}_{t1} - \text{Moisture}_{t2}}{\text{Time}_{t2} - \text{Time}_{t1}} $$
    *(Where $t1$ is just after watering and $t2$ is just before the next watering)*
*   **Input**:
    *   `Soil Moisture`: Continuous sensor readings (%).

## 3. Insights

The system derives the following insights from the data:

*   **Daily Water Use Trend**: Identifies if water consumption is increasing (plant growth/hotter weather) or decreasing (dormancy/cooler weather).
*   **High Demand Days**: Correlates steep moisture drops with environmental data (high temp, low humidity) to flag "thirsty" days.
*   **Drought Stress Avoidance**: Verifies if the irrigation logic triggers *before* moisture falls below the critical wilting point (e.g., < 30%).

## 4. Analysis Outputs

### A. Water Use Summary Table

| Date | Pump Runtime (min) | Water Added (L) | Moisture Drop (%) | Avg. Depletion Rate | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2024-05-01 | 15 | 15.0 | 45% $\to$ 30% | 1.2% / hr | Normal |
| 2024-05-02 | 20 | 20.0 | 40% $\to$ 25% | 1.8% / hr | **High Demand** |
| 2024-05-03 | 12 | 12.0 | 50% $\to$ 35% | 1.0% / hr | Normal |

### B. Soil Moisture & Irrigation Cycle (Diagram)

This ASCII diagram illustrates the "Sawtooth" pattern of soil moisture: rising rapidly during irrigation and declining gradually due to plant use.

```text
Moisture (%)
  ^
  |      (Pump ON)
80|      +---+                  +---+
  |     /|   |\                /|   |\
70|    / |   | \              / |   | \
  |   /  |   |  \            /  |   |  \
60|  /   |   |   \          /   |   |   \
  | /    |   |    \        /    |   |    \   (Plant Drinking)
50|/     |   |     \      /     |   |     \
  |      |   |      \    /      |   |      \
40|      |   |       \  /       |   |       \
  |      |   |        \/        |   |        \
30|------+---+------------------+---+---------\---- Critical Threshold (30%)
  |
  +--------------------------------------------------> Time
       Event 1              Event 2
```

### C. Interpretation Notes
*   **Steep Slope**: Indicates high transpiration (hot/sunny day) or fast drainage (sandy soil).
*   **Shallow Slope**: Indicates low water use (cloudy/cool day) or high retention (clay soil).
*   **Peak Height**: Confirms if the pump ran long enough to reach field capacity (saturation).
*   **Trough Depth**: Shows how close the plant came to water stress before the next cycle.
