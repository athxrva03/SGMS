// Configuration - Using local backend (no user configuration needed)
let updateInterval = 15; // seconds
let updateTimer;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Start fetching data
    fetchData();
});

function fetchData() {
    updateConnectionStatus('connecting');

    const url = '/api/data?limit=1';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const latest = data[0];
                updateSensorData(latest);
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
            // Fallback to mock data for demo purposes if server is not running
            console.log('Using mock data for demonstration...');
            const mockData = {
                temperature: 24 + Math.random() * 2,
                humidity: 60 + Math.random() * 5,
                soil_moisture: 45 + Math.random() * 5,
                light_intensity: 80 + Math.random() * 10,
                created_at: new Date().toISOString()
            };
            updateSensorData(mockData);
            updateConnectionStatus('connected');

            // Schedule next update
            if (updateTimer) clearInterval(updateTimer);
            updateTimer = setInterval(fetchData, updateInterval * 1000);
        });
}

function updateSensorData(data) {
    // Temperature
    const temp = parseFloat(data.temperature) || 0;
    document.getElementById('tempValue').textContent = temp.toFixed(1);
    document.getElementById('heroTemp').textContent = temp.toFixed(1) + '°C';
    updateProgress('tempProgress', temp, 0, 50);

    // Humidity
    const humidity = parseFloat(data.humidity) || 0;
    document.getElementById('humidityValue').textContent = humidity.toFixed(1);
    document.getElementById('heroHumidity').textContent = humidity.toFixed(1) + '%';
    updateProgress('humidityProgress', humidity, 0, 100);

    // Soil Moisture
    const soil = parseFloat(data.soil_moisture) || 0;
    document.getElementById('soilValue').textContent = soil.toFixed(1);
    document.getElementById('heroSoil').textContent = soil.toFixed(1) + '%';
    updateProgress('soilProgress', soil, 0, 100);

    // Light Intensity / Grow Light Status
    const light = parseFloat(data.light_intensity) || 0;
    const isLightOn = light < 20;
    const statusText = isLightOn ? 'ON' : 'OFF';

    const lightValueElem = document.getElementById('lightValue');
    if (lightValueElem) {
        lightValueElem.textContent = statusText;
        lightValueElem.style.color = isLightOn ? '#fbbf24' : '#9ca3af'; // Amber for ON, Gray for OFF
    }

    const heroLightElem = document.getElementById('heroLight');
    if (heroLightElem) {
        heroLightElem.textContent = statusText;
    }

    // Update timestamp
    const lastUpdate = new Date(data.created_at);
    document.getElementById('lastUpdateTime').textContent = lastUpdate.toLocaleTimeString();

    // Update data points
    document.getElementById('dataPoints').textContent = '1 reading';
}

function updateProgress(elementId, value, min, max) {
    const percentage = ((value - min) / (max - min)) * 100;
    const element = document.getElementById(elementId);
    if (element) {
        element.style.width = Math.min(100, Math.max(0, percentage)) + '%';
    }
}

function updateConnectionStatus(status) {
    const statusDot = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');
    const systemStatus = document.getElementById('systemStatus');

    statusDot.className = 'status-dot';

    switch (status) {
        case 'connecting':
            statusText.textContent = 'Connecting...';
            if (systemStatus) systemStatus.textContent = 'Connecting...';
            break;
        case 'connected':
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';
            if (systemStatus) systemStatus.textContent = 'Connected';
            break;
        case 'error':
            statusDot.classList.add('error');
            statusText.textContent = 'Error';
            if (systemStatus) systemStatus.textContent = 'Connection Error';
            break;
    }
}

function showNotification(message) {
    // Simple notification (you can enhance this)
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, hsl(160, 84%, 39%), hsl(217, 91%, 60%));
        color: white;
        padding: 1rem 2rem;
        border-radius: 1rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);
