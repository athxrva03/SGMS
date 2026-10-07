// Stress Analysis Logic

// Configuration
const updateInterval = 30; // seconds
let updateTimer;
let comfortChart;
let stressFactorChart;

// Optimal Ranges (Thresholds)
const THRESHOLDS = {
    temperature: { min: 15, max: 35 },
    humidity: { min: 40, max: 80 },
    soil_moisture: { min: 30, max: 70 },
    light_intensity: { min: 20, max: 100 } // Assuming % for simplicity
};

document.addEventListener('DOMContentLoaded', () => {
    setupCharts();
    fetchData();
});

function setupCharts() {
    // Comfort vs Stress Doughnut Chart
    const ctx1 = document.getElementById('comfortChart').getContext('2d');
    comfortChart = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Comfort Time', 'Stress Time'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#10b981', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom', labels: { color: '#fff' } }
            }
        }
    });

    // Stress Factors Bar Chart
    const ctx2 = document.getElementById('stressFactorChart').getContext('2d');
    stressFactorChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['Temp', 'Humidity', 'Soil', 'Light'],
            datasets: [{
                label: 'Stress Events',
                data: [0, 0, 0, 0],
                backgroundColor: ['#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b'],
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
    fetch('/api/history?limit=100')
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                analyzeStressData(data);
                updateConnectionStatus('connected');

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

function analyzeStressData(data) {
    let totalPoints = data.length;
    let stressPoints = 0;
    let stressCounts = {
        temperature: 0,
        humidity: 0,
        soil_moisture: 0,
        light_intensity: 0
    };
    let currentStressDuration = 0;
    let maxStressDuration = 0;
    let inStress = false;

    // Analyze each data point
    data.forEach(reading => {
        let isPointStressed = false;

        // Check Temperature
        if (reading.temperature < THRESHOLDS.temperature.min || reading.temperature > THRESHOLDS.temperature.max) {
            stressCounts.temperature++;
            isPointStressed = true;
        }

        // Check Humidity
        if (reading.humidity < THRESHOLDS.humidity.min || reading.humidity > THRESHOLDS.humidity.max) {
            stressCounts.humidity++;
            isPointStressed = true;
        }

        // Check Soil Moisture
        if (reading.soil_moisture < THRESHOLDS.soil_moisture.min || reading.soil_moisture > THRESHOLDS.soil_moisture.max) {
            stressCounts.soil_moisture++;
            isPointStressed = true;
        }

        // Check Light
        // Note: Light thresholds might depend on time of day, but using simple range for now
        if (reading.light_intensity < THRESHOLDS.light_intensity.min || reading.light_intensity > THRESHOLDS.light_intensity.max) {
            stressCounts.light_intensity++;
            isPointStressed = true;
        }

        if (isPointStressed) {
            stressPoints++;
            if (inStress) {
                currentStressDuration++;
            } else {
                inStress = true;
                currentStressDuration = 1;
            }
            if (currentStressDuration > maxStressDuration) {
                maxStressDuration = currentStressDuration;
            }
        } else {
            inStress = false;
            currentStressDuration = 0;
        }
    });

    // 1. Calculate Metrics
    const comfortScore = ((totalPoints - stressPoints) / totalPoints * 100).toFixed(1);

    // Estimate hours based on data frequency (assuming 1 min intervals for simplicity or calculating time span)
    // Let's use the time span of the data
    const sortedData = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const timeSpanHrs = (new Date(sortedData[sortedData.length - 1].created_at) - new Date(sortedData[0].created_at)) / (1000 * 60 * 60);
    const stressHours = ((stressPoints / totalPoints) * timeSpanHrs).toFixed(1);

    // Identify Primary Stressor
    let maxCount = 0;
    let primaryStressor = 'None';
    for (const [key, value] of Object.entries(stressCounts)) {
        if (value > maxCount) {
            maxCount = value;
            primaryStressor = key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    }

    // 2. Update UI
    document.getElementById('comfortScore').textContent = `${comfortScore}%`;
    document.getElementById('stressHours').textContent = `${stressHours} hrs`;
    document.getElementById('primaryStressor').textContent = primaryStressor;

    // Estimate longest stress in minutes (assuming uniform sampling, or just relative)
    const avgIntervalMin = (timeSpanHrs * 60) / totalPoints;
    const longestStressMin = Math.round(maxStressDuration * avgIntervalMin);
    document.getElementById('longestStress').textContent = `${longestStressMin} min`;

    // 3. Update Charts
    comfortChart.data.datasets[0].data = [totalPoints - stressPoints, stressPoints];
    comfortChart.update();

    stressFactorChart.data.datasets[0].data = [
        stressCounts.temperature,
        stressCounts.humidity,
        stressCounts.soil_moisture,
        stressCounts.light_intensity
    ];
    stressFactorChart.update();

    // 4. Generate Insights
    generateInsights(comfortScore, primaryStressor, longestStressMin);
}

function generateInsights(score, stressor, duration) {
    const qualityEl = document.getElementById('envQuality');
    const actionEl = document.getElementById('actionRequired');
    const stabilityEl = document.getElementById('stabilityIndex');

    // Quality Insight
    if (score > 80) {
        qualityEl.textContent = "Excellent! Environment is consistently within optimal ranges.";
        qualityEl.parentElement.querySelector('.recommendation-icon').className = 'recommendation-icon success';
    } else if (score > 50) {
        qualityEl.textContent = "Moderate. Some environmental factors are fluctuating.";
        qualityEl.parentElement.querySelector('.recommendation-icon').className = 'recommendation-icon warning';
    } else {
        qualityEl.textContent = "Poor. Plants are under significant environmental stress.";
        qualityEl.parentElement.querySelector('.recommendation-icon').className = 'recommendation-icon danger';
    }

    // Action Insight
    if (stressor !== 'None') {
        actionEl.textContent = `Focus on controlling ${stressor}. It is the main cause of stress.`;
    } else {
        actionEl.textContent = "No immediate actions required.";
    }

    // Stability Index
    const stability = Math.max(0, 100 - (duration / 2)); // Arbitrary formula
    stabilityEl.textContent = `${Math.round(stability)}/100`;
}
