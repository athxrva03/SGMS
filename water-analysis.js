// Water Analysis Logic

// Configuration
const updateInterval = 30; // seconds
let updateTimer;
let moistureChart;
let consumptionChart;

// Constants for simulation/calculation
const PUMP_FLOW_RATE = 2.5; // Liters per minute (assumed)
const IRRIGATION_THRESHOLD_RISE = 5; // % increase to count as irrigation
const SOIL_VOLUME_LITERS = 20; // Assumed volume of soil per plant/pot

document.addEventListener('DOMContentLoaded', () => {
    setupCharts();
    fetchData();
});

function setupCharts() {
    // Moisture Cycle Chart
    const ctx1 = document.getElementById('moistureCycleChart').getContext('2d');
    moistureChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Soil Moisture (%)',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    // Consumption Chart
    const ctx2 = document.getElementById('consumptionChart').getContext('2d');
    consumptionChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Water Used (L)',
                data: [],
                backgroundColor: '#06b6d4',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function fetchData() {
    updateConnectionStatus('connecting');
    // Fetch a large history to analyze cycles (e.g., last 100 points)
    fetch('/api/history?limit=100')
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                analyzeWaterData(data);
                updateConnectionStatus('connected');

                // Schedule next update
                if (updateTimer) clearInterval(updateTimer);
                updateTimer = setInterval(fetchData, updateInterval * 1000);
            } else {
                updateConnectionStatus('error');
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            updateConnectionStatus('error');
        });
}

function updateConnectionStatus(status) {
    const statusDot = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');

    if (!statusDot || !statusText) return;

    statusDot.className = 'status-dot';

    switch (status) {
        case 'connecting':
            statusText.textContent = 'Connecting...';
            break;
        case 'connected':
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';
            break;
        case 'error':
            statusDot.classList.add('error');
            statusText.textContent = 'Error';
            break;
    }
}

function analyzeWaterData(data) {
    // Sort data by time (oldest first)
    const sortedData = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const moistureValues = sortedData.map(d => parseFloat(d.soil_moisture));
    const timestamps = sortedData.map(d => new Date(d.created_at));

    // 1. Detect Irrigation Events
    let irrigationEvents = 0;
    let totalWaterUsed = 0;
    let consumptionPerCycle = [];
    let cycleLabels = [];
    let dryingRates = [];

    for (let i = 1; i < moistureValues.length; i++) {
        const diff = moistureValues[i] - moistureValues[i - 1];

        // If moisture jumps up significantly -> Irrigation Event
        if (diff > IRRIGATION_THRESHOLD_RISE) {
            irrigationEvents++;

            // Estimate water used: Volume * (% change / 100)
            // This is a simplified physics model
            const estimatedLiters = SOIL_VOLUME_LITERS * (diff / 100);
            totalWaterUsed += estimatedLiters;

            consumptionPerCycle.push(estimatedLiters);
            cycleLabels.push(timestamps[i].toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
        // If moisture drops -> Drying
        else if (diff < 0) {
            // Calculate rate per hour
            const timeDiffHrs = (timestamps[i] - timestamps[i - 1]) / (1000 * 60 * 60);
            if (timeDiffHrs > 0) {
                const rate = Math.abs(diff) / timeDiffHrs;
                dryingRates.push(rate);
            }
        }
    }

    // 2. Calculate Metrics
    const avgDryingRate = dryingRates.length > 0
        ? (dryingRates.reduce((a, b) => a + b, 0) / dryingRates.length).toFixed(2)
        : 0;

    // Extrapolate daily use based on the time range of data
    const timeSpanHrs = (timestamps[timestamps.length - 1] - timestamps[0]) / (1000 * 60 * 60);
    const dailyWaterUse = timeSpanHrs > 0
        ? ((totalWaterUsed / timeSpanHrs) * 24).toFixed(1)
        : 0;

    // 3. Update UI
    document.getElementById('dailyWaterUse').textContent = `${dailyWaterUse} L`;
    document.getElementById('irrigationCount').textContent = irrigationEvents;
    document.getElementById('dryingRate').textContent = `${avgDryingRate} %/hr`;

    // Estimate cycle time (avg time between irrigations)
    const cycleTime = irrigationEvents > 1
        ? (timeSpanHrs / irrigationEvents).toFixed(1)
        : '--';
    document.getElementById('cycleTime').textContent = cycleTime !== '--' ? `${cycleTime} hrs` : '--';

    // 4. Update Charts
    moistureChart.data.labels = timestamps.map(t => t.toLocaleTimeString());
    moistureChart.data.datasets[0].data = moistureValues;
    moistureChart.update();

    consumptionChart.data.labels = cycleLabels;
    consumptionChart.data.datasets[0].data = consumptionPerCycle;
    consumptionChart.update();

    // 5. Generate Insights
    generateInsights(dailyWaterUse, avgDryingRate, irrigationEvents);
}

function generateInsights(dailyUse, dryingRate, events) {
    const consumptionEl = document.getElementById('consumptionInsight');
    const stressEl = document.getElementById('stressRisk');
    const efficiencyEl = document.getElementById('efficiencyScore');

    // Consumption Insight
    if (dailyUse > 5) {
        consumptionEl.textContent = "High water usage detected. Check for leaks or over-watering.";
    } else if (dailyUse < 1) {
        consumptionEl.textContent = "Very low water usage. Ensure plants are receiving enough water.";
    } else {
        consumptionEl.textContent = "Water consumption is within normal expected range.";
    }

    // Stress Risk
    if (dryingRate > 5) {
        stressEl.textContent = "High drying rate! Soil is losing moisture very quickly.";
        stressEl.parentElement.querySelector('.recommendation-icon').className = 'recommendation-icon warning';
    } else {
        stressEl.textContent = "Drying rate is moderate. Soil retains moisture well.";
        stressEl.parentElement.querySelector('.recommendation-icon').className = 'recommendation-icon success';
    }

    // Efficiency Score (Mock calculation)
    const score = Math.min(100, Math.max(0, 100 - (dryingRate * 5)));
    efficiencyEl.textContent = `${Math.round(score)}/100`;
}
