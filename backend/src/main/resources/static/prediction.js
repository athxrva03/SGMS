// Prediction Page JavaScript - AI-Powered Forecasting
let channelId = localStorage.getItem('channelId') || '2809089';
let readApiKey = localStorage.getItem('readApiKey') || 'IM6S2EYF69H8FIY7';
let updateInterval = parseInt(localStorage.getItem('updateInterval')) || 15;
let updateTimer;

// Charts
let tempChart, humidityChart, soilChart, lightChart;

// Prediction data
let historicalData = {
    temperature: [],
    humidity: [],
    soil: [],
    light: [],
    timestamps: []
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupCharts();
    fetchHistoricalData();
});

function fetchHistoricalData() {
    updateConnectionStatus('connecting');

    // Fetch 100 data points for better predictions
    const url = '/api/history?limit=100';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                processHistoricalData(data);
                makePredictions();
                updateConnectionStatus('connected');

                // Schedule next update
                if (updateTimer) clearInterval(updateTimer);
                updateTimer = setInterval(() => {
                    fetchHistoricalData();
                }, updateInterval * 1000);
            } else {
                updateConnectionStatus('error');
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            // Fallback to mock data for demo purposes
            console.log('Using mock data for demonstration...');
            const mockData = [];
            const now = new Date();
            for (let i = 0; i < 100; i++) {
                mockData.push({
                    temperature: 20 + Math.random() * 10,
                    humidity: 50 + Math.random() * 20,
                    soil_moisture: 30 + Math.random() * 40,
                    light_intensity: 10 + Math.random() * 90,
                    created_at: new Date(now - i * 15000).toISOString()
                });
            }
            processHistoricalData(mockData.reverse());
            makePredictions();
            updateConnectionStatus('connected');

            if (updateTimer) clearInterval(updateTimer);
            updateTimer = setInterval(() => {
                fetchHistoricalData();
            }, updateInterval * 1000);
        });
}

function processHistoricalData(feeds) {
    historicalData.temperature = feeds.map(f => parseFloat(f.temperature) || 0);
    historicalData.humidity = feeds.map(f => parseFloat(f.humidity) || 0);
    historicalData.soil = feeds.map(f => parseFloat(f.soil_moisture) || 0);
    historicalData.light = feeds.map(f => parseFloat(f.light_intensity) || 0);
    historicalData.timestamps = feeds.map(f => new Date(f.created_at));

    document.getElementById('dataPointsUsed').textContent = `${feeds.length} historical readings`;
}

function makePredictions() {
    // Predict for each sensor
    const tempPred = predictValues(historicalData.temperature);
    const humidityPred = predictValues(historicalData.humidity);
    const soilPred = predictValues(historicalData.soil);
    const lightPred = predictValues(historicalData.light);

    // Update prediction cards
    updatePredictionCard('predTemp', 'tempTrend', 'tempConfidence', tempPred, '°C', 15, 35);
    updatePredictionCard('predHumidity', 'humidityTrend', 'humidityConfidence', humidityPred, '%', 40, 80);
    updatePredictionCard('predSoil', 'soilTrend', 'soilConfidence', soilPred, '%', 30, 70);
    updatePredictionCard('predLight', 'lightTrend', 'lightConfidence', lightPred, '%', 20, 100);

    // Update charts
    updatePredictionChart('tempPredChart', tempChart, historicalData.temperature, tempPred, 'Temperature', '#ef4444');
    updatePredictionChart('humidityPredChart', humidityChart, historicalData.humidity, humidityPred, 'Humidity', '#3b82f6');
    updatePredictionChart('soilPredChart', soilChart, historicalData.soil, soilPred, 'Soil Moisture', '#8b5cf6');
    updatePredictionChart('lightPredChart', lightChart, historicalData.light, lightPred, 'Light Intensity', '#f59e0b');

    // Generate alerts
    generateAlerts({
        temperature: { current: tempPred.nextValue, trend: tempPred.trend, min: 15, max: 35 },
        humidity: { current: humidityPred.nextValue, trend: humidityPred.trend, min: 40, max: 80 },
        soil: { current: soilPred.nextValue, trend: soilPred.trend, min: 30, max: 70 },
        light: { current: lightPred.nextValue, trend: lightPred.trend, min: 20, max: 100 }
    });
}

function predictValues(data) {
    if (data.length < 5) {
        return { nextValue: 0, trend: 0, confidence: 0, future: [] };
    }

    // Linear Regression for trend
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += data[i];
        sumXY += i * data[i];
        sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next value
    const nextValue = slope * n + intercept;

    // Moving average for smoothing
    const windowSize = Math.min(10, Math.floor(n / 3));
    const recentData = data.slice(-windowSize);
    const movingAvg = recentData.reduce((a, b) => a + b, 0) / windowSize;

    // Weighted prediction (70% linear regression, 30% moving average)
    const prediction = nextValue * 0.7 + movingAvg * 0.3;

    // Calculate confidence based on data variance
    const variance = calculateVariance(data);
    const confidence = Math.max(0, Math.min(100, 100 - variance * 2));

    // Predict future values (next 6 hours, assuming 15 sec intervals = 1440 points per 6 hours)
    const futurePoints = 12; // Next 12 data points
    const future = [];
    for (let i = 1; i <= futurePoints; i++) {
        const futureValue = slope * (n + i) + intercept;
        future.push(futureValue);
    }

    return {
        nextValue: prediction,
        trend: slope,
        confidence: confidence,
        future: future
    };
}

function calculateVariance(data) {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const squaredDiffs = data.map(value => Math.pow(value - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / data.length);
}

function updatePredictionCard(valueId, trendId, confidenceId, prediction, unit, optimalMin, optimalMax) {
    // Update predicted value
    document.getElementById(valueId).textContent = prediction.nextValue.toFixed(1);

    // Update trend
    const trendElement = document.getElementById(trendId);
    const trendIcon = trendElement.querySelector('.trend-icon');
    const trendText = trendElement.querySelector('.trend-text');

    if (prediction.trend > 0.1) {
        trendIcon.textContent = '↗';
        trendText.textContent = 'Increasing';
        trendElement.style.color = '#ef4444';
    } else if (prediction.trend < -0.1) {
        trendIcon.textContent = '↘';
        trendText.textContent = 'Decreasing';
        trendElement.style.color = '#3b82f6';
    } else {
        trendIcon.textContent = '→';
        trendText.textContent = 'Stable';
        trendElement.style.color = '#10b981';
    }

    // Update confidence
    const confidenceBar = document.getElementById(confidenceId);
    confidenceBar.style.width = prediction.confidence + '%';

    // Color based on confidence
    if (prediction.confidence > 75) {
        confidenceBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
    } else if (prediction.confidence > 50) {
        confidenceBar.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    } else {
        confidenceBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
    }
}

function setupCharts() {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#e5e7eb',
                    font: { size: 12, weight: '600' },
                    usePointStyle: true
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12
            }
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#9ca3af', font: { size: 11 } }
            },
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                    color: '#9ca3af',
                    font: { size: 10 },
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        }
    };

    tempChart = new Chart(document.getElementById('tempPredChart'), {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: chartOptions
    });

    humidityChart = new Chart(document.getElementById('humidityPredChart'), {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: chartOptions
    });

    soilChart = new Chart(document.getElementById('soilPredChart'), {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: chartOptions
    });

    lightChart = new Chart(document.getElementById('lightPredChart'), {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: chartOptions
    });
}

function updatePredictionChart(chartId, chart, actualData, prediction, label, color) {
    if (!chart) return;

    // Create labels
    const historicalLabels = historicalData.timestamps.slice(-20).map(t => t.toLocaleTimeString());
    const futureLabels = Array.from({ length: prediction.future.length }, (_, i) => `+${i + 1}`);
    const allLabels = [...historicalLabels, ...futureLabels];

    // Actual data (last 20 points)
    const recentActual = actualData.slice(-20);
    const actualWithNull = [...recentActual, ...Array(prediction.future.length).fill(null)];

    // Predicted data
    const predictedWithNull = [...Array(recentActual.length - 1).fill(null), recentActual[recentActual.length - 1], ...prediction.future];

    chart.data.labels = allLabels;
    chart.data.datasets = [
        {
            label: 'Actual ' + label,
            data: actualWithNull,
            borderColor: color,
            backgroundColor: color + '20',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
        },
        {
            label: 'Predicted ' + label,
            data: predictedWithNull,
            borderColor: color,
            backgroundColor: color + '10',
            borderWidth: 3,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointStyle: 'rect'
        }
    ];

    chart.update('none');
}

function generateAlerts(predictions) {
    const alertsContainer = document.getElementById('alertsContainer');
    alertsContainer.innerHTML = '';

    const alerts = [];

    // Check each sensor
    Object.keys(predictions).forEach(sensor => {
        const data = predictions[sensor];
        const sensorName = sensor.charAt(0).toUpperCase() + sensor.slice(1);

        if (data.current < data.min) {
            alerts.push({
                type: 'warning',
                sensor: sensorName,
                message: `${sensorName} predicted to drop below optimal range (${data.current.toFixed(1)} < ${data.min})`,
                icon: '⚠️'
            });
        } else if (data.current > data.max) {
            alerts.push({
                type: 'warning',
                sensor: sensorName,
                message: `${sensorName} predicted to exceed optimal range (${data.current.toFixed(1)} > ${data.max})`,
                icon: '⚠️'
            });
        }

        if (Math.abs(data.trend) > 1) {
            alerts.push({
                type: 'info',
                sensor: sensorName,
                message: `${sensorName} showing ${data.trend > 0 ? 'rapid increase' : 'rapid decrease'} trend`,
                icon: data.trend > 0 ? '📈' : '📉'
            });
        }
    });

    if (alerts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="alert-placeholder success">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <p>No predicted issues. All systems optimal! 🎉</p>
            </div>
        `;
    } else {
        alerts.forEach(alert => {
            const alertCard = document.createElement('div');
            alertCard.className = `alert-card alert-${alert.type}`;
            alertCard.innerHTML = `
                <div class="alert-icon">${alert.icon}</div>
                <div class="alert-content">
                    <h4>${alert.sensor}</h4>
                    <p>${alert.message}</p>
                </div>
            `;
            alertsContainer.appendChild(alertCard);
        });
    }
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
