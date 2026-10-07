// ===== Configuration & State Management =====
let config = {
    channelId: '2809089',
    readApiKey: 'IM6S2EYF69H8FIY7',
    updateInterval: 15000, // milliseconds
    maxDataPoints: 20
};

let state = {
    isConnected: false,
    lastUpdate: null,
    updateTimer: null,
    charts: {},
    historicalData: {
        temperature: [],
        humidity: [],
        soil: [],
        light: [],
        timestamps: []
    }
};

// ===== Initialize Application =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    console.log('Initializing Smart Greenhouse Dashboard...');

    // Load saved configuration
    loadConfiguration();

    // Initialize UI elements
    initializeConfigForm();
    initializeCharts();
    initializeChartControls();

    // Start data fetching
    startDataFetching();

    console.log('Dashboard initialized successfully');
}

// ===== Configuration Management =====
function loadConfiguration() {
    const saved = localStorage.getItem('greenhouse_config');
    if (saved) {
        const savedConfig = JSON.parse(saved);
        config = { ...config, ...savedConfig };

        // Update form fields
        document.getElementById('channelId').value = config.channelId;
        document.getElementById('readApiKey').value = config.readApiKey;
        document.getElementById('updateInterval').value = config.updateInterval / 1000;
    }
}

function saveConfiguration() {
    const channelId = document.getElementById('channelId').value.trim();
    const readApiKey = document.getElementById('readApiKey').value.trim();
    const updateInterval = parseInt(document.getElementById('updateInterval').value) * 1000;

    if (!channelId || !readApiKey) {
        showNotification('Please enter both Channel ID and Read API Key', 'error');
        return false;
    }

    config.channelId = channelId;
    config.readApiKey = readApiKey;
    config.updateInterval = updateInterval;

    localStorage.setItem('greenhouse_config', JSON.stringify(config));
    showNotification('Configuration saved successfully!', 'success');

    // Restart data fetching with new config
    stopDataFetching();
    startDataFetching();

    return true;
}

function initializeConfigForm() {
    const saveBtn = document.getElementById('saveConfigBtn');
    saveBtn.addEventListener('click', saveConfiguration);
}

// ===== Data Fetching =====
function startDataFetching() {
    console.log('Starting data fetch with interval:', config.updateInterval);

    // Initial fetch
    fetchSensorData();

    // Set up periodic fetching
    state.updateTimer = setInterval(fetchSensorData, config.updateInterval);
}

function stopDataFetching() {
    if (state.updateTimer) {
        clearInterval(state.updateTimer);
        state.updateTimer = null;
    }
}

async function fetchSensorData() {
    try {
        updateConnectionStatus('connecting');

        // Use relative path so it works on both localhost and deployed site
        const url = '/api/data?limit=' + config.maxDataPoints;

        console.log('Fetching data from local backend...');
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            throw new Error('No data available');
        }

        console.log('Data received successfully:', data.length, 'entries');

        // Process and update UI
        processData(data);
        updateConnectionStatus('connected');

    } catch (error) {
        console.error('Error fetching sensor data:', error);

        // Fallback to mock data
        console.log('Using mock data for demonstration...');
        const mockData = [];
        const now = new Date();
        for (let i = 0; i < config.maxDataPoints; i++) {
            mockData.push({
                temperature: 20 + Math.random() * 10,
                humidity: 50 + Math.random() * 20,
                soil_moisture: 30 + Math.random() * 40,
                light_intensity: 10 + Math.random() * 90,
                created_at: new Date(now - i * 15000).toISOString()
            });
        }
        processData(mockData.reverse());
        updateConnectionStatus('connected');
        showNotification('Using demo mode (Backend not reachable)', 'info');
    }
}

function processData(feeds) {
    const latestFeed = feeds[feeds.length - 1];

    // Update current values
    updateSensorCard('temperature', parseFloat(latestFeed.temperature) || 0, 15, 35);
    updateSensorCard('humidity', parseFloat(latestFeed.humidity) || 0, 40, 80);
    updateSensorCard('soil', parseFloat(latestFeed.soil_moisture) || 0, 30, 70);
    updateSensorCard('light', parseFloat(latestFeed.light_intensity) || 0, 20, 100);

    // Update historical data
    state.historicalData.temperature = [];
    state.historicalData.humidity = [];
    state.historicalData.soil = [];
    state.historicalData.light = [];
    state.historicalData.timestamps = [];

    feeds.forEach(feed => {
        state.historicalData.temperature.push(parseFloat(feed.temperature) || 0);
        state.historicalData.humidity.push(parseFloat(feed.humidity) || 0);
        state.historicalData.soil.push(parseFloat(feed.soil_moisture) || 0);
        state.historicalData.light.push(parseFloat(feed.light_intensity) || 0);

        const timestamp = new Date(feed.created_at);
        state.historicalData.timestamps.push(timestamp.toLocaleTimeString());
    });

    // Update charts
    updateCharts();

    // Update statistics
    updateStatistics();

    // Update last update time
    state.lastUpdate = new Date();
    document.getElementById('lastUpdateTime').textContent = state.lastUpdate.toLocaleTimeString();
}

function updateSensorCard(sensor, value, minRange, maxRange) {
    const valueElement = document.getElementById(`${sensor}Value`);
    const barElement = document.getElementById(`${sensor}Bar`);

    if (!valueElement || !barElement) return;

    // Animate value change
    const currentValue = parseFloat(valueElement.textContent) || 0;
    animateValue(valueElement, currentValue, value, 500);

    // Update progress bar
    const percentage = ((value - minRange) / (maxRange - minRange)) * 100;
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    barElement.style.width = clampedPercentage + '%';

    // Update gradient based on sensor type
    updateBarGradient(barElement, sensor, clampedPercentage);
}

function updateBarGradient(element, sensor, percentage) {
    const gradients = {
        temperature: 'linear-gradient(90deg, hsl(200, 91%, 60%), hsl(0, 91%, 71%))',
        humidity: 'linear-gradient(90deg, hsl(160, 84%, 39%), hsl(200, 91%, 60%))',
        soil: 'linear-gradient(90deg, hsl(30, 67%, 55%), hsl(160, 84%, 39%))',
        light: 'linear-gradient(90deg, hsl(30, 67%, 55%), hsl(45, 100%, 60%))'
    };

    element.style.background = gradients[sensor] || 'linear-gradient(90deg, hsl(160, 84%, 39%), hsl(217, 91%, 60%))';
}

function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    const difference = end - start;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOutQuad = progress * (2 - progress);
        const current = start + (difference * easeOutQuad);

        element.textContent = current.toFixed(1);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ===== Charts Management =====
function initializeCharts() {
    const chartConfig = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: 'hsl(0, 0%, 95%)',
                    font: {
                        family: 'Inter',
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'hsla(220, 20%, 16%, 0.95)',
                titleColor: 'hsl(0, 0%, 95%)',
                bodyColor: 'hsl(0, 0%, 70%)',
                borderColor: 'hsla(0, 0%, 100%, 0.1)',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += context.parsed.y.toFixed(1);
                        label += context.dataset.unit || '';
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'hsla(0, 0%, 100%, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: 'hsl(0, 0%, 70%)',
                    font: {
                        family: 'Inter',
                        size: 11
                    }
                }
            },
            y: {
                grid: {
                    color: 'hsla(0, 0%, 100%, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    color: 'hsl(0, 0%, 70%)',
                    font: {
                        family: 'Inter',
                        size: 11
                    }
                }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false
        }
    };

    // Temperature & Humidity Chart
    const tempHumidityCtx = document.getElementById('tempHumidityChart').getContext('2d');
    state.charts.tempHumidity = new Chart(tempHumidityCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Temperature',
                    data: [],
                    borderColor: 'hsl(0, 91%, 71%)',
                    backgroundColor: 'hsla(0, 91%, 71%, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    unit: '°C'
                },
                {
                    label: 'Humidity',
                    data: [],
                    borderColor: 'hsl(200, 91%, 60%)',
                    backgroundColor: 'hsla(200, 91%, 60%, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    unit: '%'
                }
            ]
        },
        options: chartConfig
    });

    // Soil Moisture & Light Chart
    const soilLightCtx = document.getElementById('soilLightChart').getContext('2d');
    state.charts.soilLight = new Chart(soilLightCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Soil Moisture',
                    data: [],
                    borderColor: 'hsl(30, 67%, 55%)',
                    backgroundColor: 'hsla(30, 67%, 55%, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    unit: '%'
                },
                {
                    label: 'Light Intensity',
                    data: [],
                    borderColor: 'hsl(45, 100%, 60%)',
                    backgroundColor: 'hsla(45, 100%, 60%, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    unit: '%'
                }
            ]
        },
        options: chartConfig
    });
}

function updateCharts() {
    const dataLength = state.historicalData.timestamps.length;
    const start = Math.max(0, dataLength - config.maxDataPoints);

    // Update Temperature & Humidity Chart
    state.charts.tempHumidity.data.labels = state.historicalData.timestamps.slice(start);
    state.charts.tempHumidity.data.datasets[0].data = state.historicalData.temperature.slice(start);
    state.charts.tempHumidity.data.datasets[1].data = state.historicalData.humidity.slice(start);
    state.charts.tempHumidity.update('none');

    // Update Soil & Light Chart
    state.charts.soilLight.data.labels = state.historicalData.timestamps.slice(start);
    state.charts.soilLight.data.datasets[0].data = state.historicalData.soil.slice(start);
    state.charts.soilLight.data.datasets[1].data = state.historicalData.light.slice(start);
    state.charts.soilLight.update('none');
}

function initializeChartControls() {
    const chartButtons = document.querySelectorAll('.chart-btn');

    chartButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const range = parseInt(e.target.dataset.range);

            // Update active state
            e.target.parentElement.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Update max data points
            config.maxDataPoints = range;

            // Update charts
            updateCharts();
        });
    });
}

// ===== Statistics =====
function updateStatistics() {
    const data = state.historicalData;

    if (data.temperature.length === 0) return;

    const avgTemp = calculateAverage(data.temperature);
    const avgHumidity = calculateAverage(data.humidity);
    const avgSoil = calculateAverage(data.soil);
    const avgLight = calculateAverage(data.light);

    document.getElementById('avgTemp').textContent = avgTemp.toFixed(1) + ' °C';
    document.getElementById('avgHumidity').textContent = avgHumidity.toFixed(1) + ' %';
    document.getElementById('avgSoil').textContent = avgSoil.toFixed(1) + ' %';
    document.getElementById('avgLight').textContent = avgLight.toFixed(1) + ' %';
}

function calculateAverage(array) {
    if (array.length === 0) return 0;
    const sum = array.reduce((a, b) => a + b, 0);
    return sum / array.length;
}

// ===== UI Updates =====
function updateConnectionStatus(status) {
    const statusDot = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');

    statusDot.classList.remove('connected', 'error');

    switch (status) {
        case 'connecting':
            statusText.textContent = 'Connecting...';
            state.isConnected = false;
            break;
        case 'connected':
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';
            state.isConnected = true;
            break;
        case 'error':
            statusDot.classList.add('error');
            statusText.textContent = 'Connection Error';
            state.isConnected = false;
            break;
    }
}

function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'error' ? 'hsl(0, 91%, 71%)' : 'hsl(160, 84%, 39%)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== Utility Functions =====
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// ===== Cleanup on Page Unload =====
window.addEventListener('beforeunload', () => {
    stopDataFetching();
});
