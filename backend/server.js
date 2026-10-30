const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const pool = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Initialize database tables
async function initializeDatabase() {
    try {
        // Create users table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255),
                role ENUM('admin', 'student') NOT NULL,
                student_id VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create events table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                student_id VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                event_name VARCHAR(255) NOT NULL,
                event_date DATE,
                event_start_date DATE,
                event_end_date DATE,
                proof_photo1 VARCHAR(255),
                proof_photo2 VARCHAR(255),
                certificate VARCHAR(255),
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create login_history table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS login_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1); // Exit the process if database initialization fails
    }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    await initializeDatabase();
    console.log(`Server running on port ${PORT}`);
}); 