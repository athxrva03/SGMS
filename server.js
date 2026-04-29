require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '.'))); // Serve static files from current directory

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'stockvision',
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to database.');

    // Auto-create table if it doesn't exist
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            temperature FLOAT,
            humidity FLOAT,
            soil_moisture FLOAT,
            light_intensity FLOAT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(createTableQuery, (err) => {
        if (err) {
            console.error('Error ensuring table exists:', err);
        } else {
            console.log('Table "sensor_readings" is ready.');
        }
    });
});

// API Endpoints

// 1. POST /api/data - Receive data from ESP
app.post('/api/data', (req, res) => {
    const { temperature, humidity, soil_moisture, light_intensity } = req.body;

    if (temperature === undefined || humidity === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = 'INSERT INTO sensor_readings (temperature, humidity, soil_moisture, light_intensity) VALUES (?, ?, ?, ?)';
    db.query(query, [temperature, humidity, soil_moisture, light_intensity], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Data inserted successfully', id: result.insertId });
    });
});

// 2. GET /api/data - Get latest data (for home page)
app.get('/api/data', (req, res) => {
    const limit = parseInt(req.query.limit) || 1;
    const query = 'SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT ?';

    db.query(query, [limit], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Format data to match ThingSpeak format if possible, or just send clean JSON
        // The frontend expects { feeds: [...] } style if we want to minimize changes, 
        // but let's send a clean structure and update frontend to match.
        res.json(results);
    });
});

// 3. GET /api/history - Get historical data (for charts)
app.get('/api/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const query = 'SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT ?';

    db.query(query, [limit], (err, results) => {
        if (err) {
            console.error('Error fetching history:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        // Return in reverse order for charts (oldest to newest)
        res.json(results.reverse());
    });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
