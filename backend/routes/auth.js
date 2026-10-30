const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Email not found' });
        }

        const user = users[0];

        // If user is admin, verify password
        if (user.role === 'admin') {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid password' });
            }
        }

        // Record login in history
        try {
            const [result] = await db.query(
                'INSERT INTO login_history (user_id) VALUES (?)',
                [user.id]
            );
            console.log('Login recorded successfully:', result);
        } catch (dbError) {
            console.error('Error recording login:', dbError);
        }

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Register route
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, studentId } = req.body;

        // Check if email already exists
        const [existingUsers] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password if it's an admin
        let hashedPassword = null;
        if (role === 'admin' && password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Create new user
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, student_id) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role, studentId]
        );

        res.status(201).json({ 
            message: 'Registration successful', 
            userId: result.insertId 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Get login history route
router.get('/login-history', async (req, res) => {
    try {
        const [loginHistory] = await db.query(`
            SELECT lh.*, u.name, u.email, u.role, u.student_id 
            FROM login_history lh
            JOIN users u ON lh.user_id = u.id
            ORDER BY lh.login_time DESC
        `);
        res.json(loginHistory);
    } catch (error) {
        console.error('Error fetching login history:', error);
        res.status(500).json({ message: 'Error fetching login history' });
    }
});

module.exports = router; 