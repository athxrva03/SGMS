// Sensor Detail Page JavaScript
// Configuration
let channelId = localStorage.getItem('channelId') || '2809089';
let readApiKey = localStorage.getItem('readApiKey') || 'IM6S2EYF69H8FIY7';
let updateInterval = parseInt(localStorage.getItem('updateInterval')) || 15;
let updateTimer;
let chart;
let dataRange = 20;

// Get sensor configuration from page
const sensorType = window.SENSOR_TYPE;
const sensorField = window.SENSOR_FIELD;
const sensorUnit = window.SENSOR_UNIT;
const sensorMin = window.SENSOR_MIN;
const sensorMax = window.SENSOR_MAX;
const sensorOptimalMin = window.SENSOR_OPTIMAL_MIN;
const sensorOptimalMax = window.SENSOR_OPTIMAL_MAX;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupChart();
    setupControls();
    fetchData();
});

function setupControls() {
    const buttons = document.querySelectorAll('.chart-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            dataRange = parseInt(btn.dataset.range);
            fetchData();
        });
    });
}

function fetchData() {
    updateConnectionStatus('connecting');

    const url = `/api/history?limit=${dataRange}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('API Response:', data); // Debug log
            if (data && data.length > 0) {
                console.log('Processing data for field:', window.SENSOR_FIELD); // Debug log
                processData(data);
                updateConnectionStatus('connected');

                // Schedule next update
                if (updateTimer) clearInterval(updateTimer);
                updateTimer = setInterval(fetchData, updateInterval * 1000);
            } else {
                console.warn('API returned empty data or invalid format'); // Debug log
                updateConnectionStatus('error');
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);

            // Fallback to mock data for demonstration
            console.log('Using mock data for demonstration...');

            // Generate mock history data
            const mockData = [];
            const now = new Date();

            for (let i = 0; i < dataRange; i++) {
                const time = new Date(now.getTime() - (dataRange - 1 - i) * updateInterval * 1000);

                // Generate random values based on sensor type
                let val;
                if (sensorType === 'temperature') val = 20 + Math.random() * 10; // 20-30
                else if (sensorType === 'humidity') val = 50 + Math.random() * 20; // 50-70
                else if (sensorType === 'soil') val = 30 + Math.random() * 40; // 30-70
                else if (sensorType === 'light') val = 60 + Math.random() * 30; // 60-90
                else val = 50; // Default fallback

                mockData.push({
                    [sensorField]: val,
                    created_at: time.toISOString()
                });
            }

            processData(mockData);
            updateConnectionStatus('connected');

            // Still schedule retry
            if (updateTimer) clearInterval(updateTimer);
            updateTimer = setInterval(fetchData, updateInterval * 1000);
        });
}

function processData(feeds) {
    try {
        console.log('Processing feeds:', feeds.length, 'items'); // Debug

        if (!feeds || feeds.length === 0) {
            console.warn('No feeds to process');
            return;
        }

        const values = feeds.map(f => {
            const val = parseFloat(f[sensorField]);
            return isNaN(val) ? 0 : val;
        });

        const timestamps = feeds.map(f => new Date(f.created_at));

        console.log('Extracted values:', values); // Debug

        if (values.length === 0) {
            console.warn('No valid values extracted');
            return;
        }

        // Update current value
        const currentValue = values[values.length - 1];
        const tempValueElement = document.getElementById('tempValue');
        if (tempValueElement) {
            tempValueElement.textContent = (currentValue !== undefined && currentValue !== null) ? currentValue.toFixed(1) : '--';
        }

        // Update circular progress
        updateCircularProgress(currentValue);

        // Update statistics
        const max = Math.max(...values);
        const min = Math.min(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        const maxEl = document.getElementById('maxTemp');
        if (maxEl) maxEl.textContent = max.toFixed(1) + ' ' + sensorUnit;

        const minEl = document.getElementById('minTemp');
        if (minEl) minEl.textContent = min.toFixed(1) + ' ' + sensorUnit;

        const avgEl = document.getElementById('avgTemp');
        if (avgEl) avgEl.textContent = avg.toFixed(1) + ' ' + sensorUnit;

        // Update status
        updateStatus(currentValue);

        // Update chart
        updateChart(timestamps, values);

    } catch (error) {
        console.error('Error in processData:', error);
    }
}

function updateCircularProgress(value) {
    const percentage = ((value - sensorMin) / (sensorMax - sensorMin)) * 100;
    const circle = document.getElementById('tempCircle');
    const percentageText = document.getElementById('tempPercentage');

    if (circle && percentageText) {
        const circumference = 2 * Math.PI * 90; // radius is 90
        const offset = circumference - (percentage / 100 * circumference);
        circle.style.strokeDashoffset = offset;
        percentageText.textContent = Math.round(percentage) + '%';
    }
}

function updateStatus(value) {
    const statusDot = document.getElementById('tempStatusDot');
    const statusText = document.getElementById('tempStatusText');

    if (!statusDot || !statusText) return;

    statusDot.className = 'status-dot-large';

    if (value >= sensorOptimalMin && value <= sensorOptimalMax) {
        statusDot.classList.add('optimal');
        statusText.textContent = 'Optimal Range';
    } else if (value < sensorOptimalMin - 10 || value > sensorOptimalMax + 10) {
        statusDot.classList.add('danger');
        statusText.textContent = 'Critical Level';
    } else {
        statusDot.classList.add('warning');
        statusText.textContent = 'Sub-optimal';
    }
}

function setupChart() {
    const ctx = document.getElementById('tempChart');
    if (!ctx) return;

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, getSensorGradientStart());
    gradient.addColorStop(1, getSensorGradientEnd());

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: capitalize(sensorType),
                data: [],
                borderColor: getSensorColor(),
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: getSensorColor(),
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6
            }]
        },
        options: {
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
                        font: {
                            size: 14,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#e5e7eb',
                    borderColor: getSensorColor(),
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (context) => {
                            return `${context.parsed.y.toFixed(1)} ${sensorUnit}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            size: 12
                        },
                        callback: (value) => value.toFixed(0) + sensorUnit
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function updateChart(timestamps, values) {
    if (!chart) return;

    chart.data.labels = timestamps.map(t => t.toLocaleTimeString());
    chart.data.datasets[0].data = values;
    chart.update('none');
}

function getSensorColor() {
    const colors = {
        temperature: '#ef4444',
        humidity: '#3b82f6',
        soil: '#8b5cf6',
        light: '#f59e0b'
    };
    return colors[sensorType] || '#10b981';
}

function getSensorGradientStart() {
    const colors = {
        temperature: 'rgba(239, 68, 68, 0.3)',
        humidity: 'rgba(59, 130, 246, 0.3)',
        soil: 'rgba(139, 92, 246, 0.3)',
        light: 'rgba(245, 158, 11, 0.3)'
    };
    return colors[sensorType] || 'rgba(16, 185, 129, 0.3)';
}

function getSensorGradientEnd() {
    const colors = {
        temperature: 'rgba(239, 68, 68, 0.0)',
        humidity: 'rgba(59, 130, 246, 0.0)',
        soil: 'rgba(139, 92, 246, 0.0)',
        light: 'rgba(245, 158, 11, 0.0)'
    };
    return colors[sensorType] || 'rgba(16, 185, 129, 0.0)';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
