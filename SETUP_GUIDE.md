# Smart Greenhouse Dashboard - Setup Guide

## Prerequisites
- ✅ Node.js installed (v16 or higher)
- ✅ MySQL installed and running

## Step-by-Step Setup

### 1. Verify Node.js Installation
Close and reopen your PowerShell/Command Prompt, then run:
```bash
node --version
npm --version
```
You should see version numbers. If not, you may need to restart your computer after installing Node.js.

### 2. Install Node.js Dependencies
Navigate to the project directory and install dependencies:
```bash
cd d:\stockvision
npm install
```

### 3. Set Up MySQL Database

#### Option A: Using MySQL Command Line
```bash
mysql -u root -p < schema.sql
```
Enter your MySQL password when prompted.

#### Option B: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Open the file `schema.sql`
4. Execute the script (Ctrl + Shift + Enter)

#### Option C: Manual Setup
Open MySQL Command Line Client and run:
```sql
CREATE DATABASE IF NOT EXISTS stockvision;
USE stockvision;

CREATE TABLE IF NOT EXISTS sensor_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperature FLOAT,
    humidity FLOAT,
    soil_moisture FLOAT,
    light_intensity FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Configure Database Connection
Check the `.env` file and update if needed:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=stockvision
PORT=3000
```

### 5. (Optional) Add Sample Data
To test the system with sample data, run this in MySQL:
```sql
USE stockvision;

INSERT INTO sensor_readings (temperature, humidity, soil_moisture, light_intensity) VALUES
(22.5, 65.2, 45.8, 320.5),
(23.1, 64.8, 46.2, 325.3),
(22.8, 66.1, 45.5, 318.7),
(24.2, 63.5, 47.1, 330.2),
(23.5, 65.0, 46.8, 322.9);
```

### 6. Start the Server
```bash
npm start
```

You should see:
```
Connected to database.
Server running on http://localhost:3000
```

### 7. Open the Dashboard
Open Chrome and navigate to:
```
http://localhost:3000
```

## Troubleshooting

### Node.js not recognized
- **Solution**: Restart your PowerShell/Command Prompt
- If that doesn't work, restart your computer
- Verify Node.js is in your PATH environment variable

### MySQL Connection Failed
- **Solution**: Check that MySQL service is running
- Verify your MySQL username and password in `.env`
- Make sure MySQL is running on port 3306

### Port 3000 already in use
- **Solution**: Kill the process using port 3000 or change the PORT in `.env`
```bash
# Find and kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### Database Error
- **Solution**: Make sure you've created the database and table using `schema.sql`
- Check your MySQL credentials in `.env`

## Next Steps

### Connecting Your ESP32/Arduino
Your ESP32 should send POST requests to:
```
http://YOUR_SERVER_IP:3000/api/data
```

Example payload:
```json
{
  "temperature": 25.5,
  "humidity": 60.2,
  "soil_moisture": 45.0,
  "light_intensity": 350.5
}
```

### API Endpoints

1. **POST /api/data** - Receive sensor data from ESP32
2. **GET /api/data?limit=1** - Get latest sensor reading
3. **GET /api/history?limit=20** - Get historical data for charts

## Support

Created by: Adarsh Patel, Atharva Rathore, Gourav Mahajan, Kunal Sonare
Guide: Prof. Mahendra Verma
Institution: Acropolis Institute of Technology and Research
